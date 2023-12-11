import { MainService } from 'src/app/main.service';
import { Injectable, TemplateRef } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GlobalToastService {
  toasts: any[] = [];
  constructor(private service: MainService) {}
  show(textOrTpl: string | TemplateRef<any>, options: any = {}) {
    this.toasts.push({ textOrTpl, ...options });
  }

  remove(toast: any) {
    this.toasts = this.toasts.filter((t) => t !== toast);
  }

  showSuccess(message: string, delay: number) {
    this.service.play('success.wav');
    this.show(message, {
      classname: 'bg-success text-light',
      delay: delay,
    });
  }

  showDanger(message: string, delay: number) {
    this.service.play('error.wav');
    this.show(message, { classname: 'bg-danger text-light', delay: delay });
  }
  showWarning(message: string, delay: number) {
    this.show(message, { classname: 'bg-warning', delay: delay });
  }
}
