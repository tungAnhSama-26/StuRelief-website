import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Giao diện thiết kế cao cấp cho SweetAlert2 đồng bộ với phong cách StuRelief
const swalCustomClasses = {
  popup: 'rounded-[32px] border border-zinc-200/80 dark:border-zinc-800 bg-white/98 dark:bg-zinc-900/98 backdrop-blur-md p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)] transition-all duration-300 font-sans',
  title: 'text-base md:text-lg font-bold tracking-tight text-zinc-950 dark:text-white mb-2 pt-2',
  htmlContainer: 'text-xs md:text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6',
  confirmButton: 'px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all duration-200 active:scale-95 shadow-md shadow-blue-500/10 cursor-pointer outline-none select-none inline-flex items-center justify-center gap-1.5',
  cancelButton: 'px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-2xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer outline-none select-none inline-flex items-center justify-center gap-1.5',
  actions: 'gap-3',
};

export const showSuccessAlert = (title: string, text: string) => {
  return MySwal.fire({
    title: title,
    text: text,
    icon: 'success',
    showConfirmButton: false,
    timer: 2000,
    customClass: {
      popup: swalCustomClasses.popup,
      title: swalCustomClasses.title,
      htmlContainer: swalCustomClasses.htmlContainer,
    },
    showClass: {
      popup: 'animate-scale-up',
    },
    hideClass: {
      popup: 'animate-scale-down',
    },
  });
};

export const showErrorAlert = (title: string, text: string) => {
  return MySwal.fire({
    title: title,
    text: text,
    icon: 'error',
    confirmButtonText: 'Đóng',
    customClass: {
      popup: swalCustomClasses.popup,
      title: swalCustomClasses.title,
      htmlContainer: swalCustomClasses.htmlContainer,
      confirmButton: swalCustomClasses.confirmButton + ' bg-rose-600 hover:bg-rose-700 shadow-rose-500/15',
    },
    showClass: {
      popup: 'animate-scale-up',
    },
    hideClass: {
      popup: 'animate-scale-down',
    },
    buttonsStyling: false,
  });
};

export const showConfirmAlert = (title: string, text: string, confirmText: string = 'Đồng ý', cancelText: string = 'Hủy') => {
  return MySwal.fire({
    title: title,
    text: text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    customClass: {
      popup: swalCustomClasses.popup,
      title: swalCustomClasses.title,
      htmlContainer: swalCustomClasses.htmlContainer,
      actions: swalCustomClasses.actions,
      confirmButton: swalCustomClasses.confirmButton + ' bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/15 border-none outline-none',
      cancelButton: swalCustomClasses.cancelButton + ' border-none outline-none',
    },
    showClass: {
      popup: 'animate-scale-up',
    },
    hideClass: {
      popup: 'animate-scale-down',
    },
    buttonsStyling: false,
  });
};
