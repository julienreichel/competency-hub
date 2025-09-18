import type {
  TransferProgressEvent,
  UploadDataWithPathInput,
  UploadDataWithPathOutput,
} from 'aws-amplify/storage';
import { getUrl, uploadData } from 'aws-amplify/storage';
import { createUploaderComponent } from 'quasar';
import { computed, ref } from 'vue';

type UploadedFile = File & {
  path?: string;
  url?: string;
};

type MaybeFunction<TArgument, TValue> = TValue | ((arg: TArgument) => TValue);

type StorageFactoryConfig = {
  filename?: MaybeFunction<UploadedFile, string>;
  folder?: MaybeFunction<UploadedFile, string>;
  contentType?: MaybeFunction<UploadedFile, string | undefined>;
  metadata?: MaybeFunction<UploadedFile, Record<string, string> | undefined>;
};

type AmplifyUploaderFactory = StorageFactoryConfig & {
  batch?: MaybeFunction<UploadedFile[], boolean>;
};

function resolveProp<TArgument, TValue>(
  prop: MaybeFunction<TArgument, TValue>,
  arg: TArgument,
): TValue {
  if (typeof prop === 'function') {
    return (prop as (value: TArgument) => TValue)(arg);
  }
  return prop;
}

export default createUploaderComponent({
  name: 'AmplifyUploader',

  props: {
    filename: {
      type: [Function, String],
      default: (): ((file: UploadedFile) => string) => (file: UploadedFile) => file.name,
    },
    folder: {
      type: [Function, String],
      default: 'protected',
    },
    contentType: {
      type: [Function, String],
      default: (): ((file: UploadedFile) => string) => (file: UploadedFile) =>
        file.type || 'application/octet-stream',
    },
    metadata: {
      type: [Function, Object],
      default: (): Record<string, string> => ({}),
    },
    batch: {
      type: [Function, Boolean],
      default: (): boolean => false,
    },
    factory: Function,
  },

  emits: ['factoryFailed', 'uploaded', 'failed', 'uploading'],

  // eslint-disable-next-line max-lines-per-function
  injectPlugin({ props, emit, helpers }) {
    const storages = ref<UploadDataWithPathOutput[]>([]);
    const promises = ref<Promise<unknown>[]>([]);
    const workingThreads = ref(0);
    let abortPromises = false;

    const baseFactory = computed<AmplifyUploaderFactory>(() => ({
      filename: props.filename as MaybeFunction<UploadedFile, string>,
      folder: props.folder as MaybeFunction<UploadedFile, string>,
      contentType: props.contentType as MaybeFunction<UploadedFile, string | undefined>,
      metadata: props.metadata as MaybeFunction<UploadedFile, Record<string, string> | undefined>,
      batch: props.batch as MaybeFunction<UploadedFile[], boolean>,
    }));

    const isUploading = computed(() => workingThreads.value > 0);
    const isBusy = computed(() => promises.value.length > 0);

    function abort(): void {
      storages.value.forEach((storage) => storage.cancel());
      if (promises.value.length > 0) {
        abortPromises = true;
      }
    }

    function upload(): void {
      const queue = helpers.queuedFiles.value.slice();
      helpers.queuedFiles.value = [];

      const shouldBatch = resolveProp(baseFactory.value.batch ?? false, queue);
      if (shouldBatch) {
        void runFactory(queue);
      } else {
        queue.forEach((file) => void runFactory([file]));
      }
    }

    function runFactory(files: UploadedFile[]): void {
      workingThreads.value += 1;

      if (typeof props.factory !== 'function') {
        void performUpload(files, {});
        return;
      }

      const result = props.factory(files);

      if (!result) {
        emit(
          'factoryFailed',
          new Error('AmplifyUploader: factory() did not return a value'),
          files,
        );
        workingThreads.value -= 1;
        return;
      }

      if (typeof (result as Promise<AmplifyUploaderFactory>).then === 'function') {
        const promise = result as Promise<AmplifyUploaderFactory>;
        promises.value.push(promise);

        const handleFailure = (error: unknown): void => {
          if (!helpers.isAlive()) {
            return;
          }
          promises.value = promises.value.filter((p) => p !== promise);
          if (promises.value.length === 0) {
            abortPromises = false;
          }
          helpers.queuedFiles.value = helpers.queuedFiles.value.concat(files);
          files.forEach((file) => helpers.updateFileStatus(file, 'failed'));
          emit('factoryFailed', error, files);
          workingThreads.value -= 1;
        };

        promise
          .then((factoryConfig) => {
            if (!helpers.isAlive()) {
              return;
            }
            promises.value = promises.value.filter((p) => p !== promise);
            if (abortPromises) {
              handleFailure(new Error('AmplifyUploader: upload aborted'));
              return;
            }
            void performUpload(files, factoryConfig ?? {});
          })
          .catch(handleFailure);
      } else {
        void performUpload(files, (result as AmplifyUploaderFactory) ?? {});
      }
    }

    async function performUpload(
      files: UploadedFile[],
      factory: AmplifyUploaderFactory,
    ): Promise<void> {
      emit('uploading', { files });

      for (const file of files) {
        await uploadSingleFile(file, factory);
      }

      emit('uploaded', { files });
      workingThreads.value -= 1;
    }

    async function uploadSingleFile(
      file: UploadedFile,
      factory: AmplifyUploaderFactory,
    ): Promise<void> {
      try {
        const filename = resolveProp(factory.filename ?? baseFactory.value.filename!, file);
        const folder = resolveProp(factory.folder ?? baseFactory.value.folder!, file);
        const contentType = resolveProp(
          factory.contentType ?? baseFactory.value.contentType!,
          file,
        );
        const metadata = resolveProp(factory.metadata ?? baseFactory.value.metadata!, file);

        if (!filename) {
          console.error('AmplifyUploader: filename is required');
          helpers.updateFileStatus(file, 'failed');
          return;
        }

        const uploadOptions: {
          contentType?: string;
          metadata?: Record<string, string>;
          onProgress?: (event: TransferProgressEvent) => void;
        } = {};

        if (contentType) {
          uploadOptions.contentType = contentType;
        }

        if (metadata) {
          uploadOptions.metadata = metadata;
        }

        uploadOptions.onProgress = ({ transferredBytes }: TransferProgressEvent): void => {
          helpers.uploadedSize.value += transferredBytes;
          helpers.updateFileStatus(file, 'uploading', transferredBytes);
        };

        const uploadInput: UploadDataWithPathInput = {
          path: `${folder}/${filename}`,
          data: file,
          options: uploadOptions,
        };

        const storageTask = uploadData(uploadInput);

        storages.value.push(storageTask);
        helpers.updateFileStatus(file, 'uploading', 0);

        const result = await storageTask.result;
        const downloadUrl = await getUrl({ path: result.path });

        Object.assign(file, {
          path: result.path,
          url: downloadUrl.url.toString(),
        });

        helpers.uploadedFiles.value.push(file);
        helpers.updateFileStatus(file, 'uploaded');
        storages.value = storages.value.filter((s) => s !== storageTask);
      } catch (error) {
        console.error('AmplifyUploader: upload failed', error);
        helpers.updateFileStatus(file, 'failed');
        emit('failed', { file, error });
      }
    }

    return {
      isUploading,
      isBusy,
      abort,
      upload,
    };
  },
});
