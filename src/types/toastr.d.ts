declare module "toastr" {
  interface ToastrOptions {
    closeButton?: boolean;
    debug?: boolean;
    newestOnTop?: boolean;
    progressBar?: boolean;
    positionClass?:
      | "toast-top-right"
      | "toast-bottom-right"
      | "toast-bottom-left"
      | "toast-top-left"
      | "toast-top-full-width"
      | "toast-bottom-full-width"
      | "toast-top-center"
      | "toast-bottom-center";
    preventDuplicates?: boolean;
    onclick?: () => void;
    showDuration?: number;
    hideDuration?: number;
    timeOut?: number;
    extendedTimeOut?: number;
    showEasing?: string;
    hideEasing?: string;
    showMethod?: string;
    hideMethod?: string;
  }

  interface Toastr {
    options: ToastrOptions;
    success(message: string, title?: string): void;
    info(message: string, title?: string): void;
    warning(message: string, title?: string): void;
    error(message: string, title?: string): void;
    clear(): void;
    remove(): void;
  }

  const toastr: Toastr;
  export default toastr;
}
