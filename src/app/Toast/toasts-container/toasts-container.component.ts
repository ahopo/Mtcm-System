
 
import { Component } from '@angular/core';
import { TemplateRef } from '@angular/core';
import { GlobalToastService } from '../global-toast.service';


@Component({
  selector: 'app-toasts',
  templateUrl: './toasts-container.component.html',
  styleUrls: ['./toasts-container.component.scss']
})
export class ToastsContainerComponent {

  constructor(public toastService: GlobalToastService) { }

  isTemplate(toast: { textOrTpl: any; }) { return toast.textOrTpl instanceof TemplateRef; }

}
