import { saveAs } from 'file-saver';
import { IPayment } from './../../../helper';
import { MainService } from './../../../main.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, Input, OnInit } from '@angular/core';
import { CurrencyMaskInputMode } from 'ngx-currency';
const date = require('date-and-time');
import { API } from 'src/app/helper';
@Component({
  selector: 'app-payment-form',
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.scss'],
})
export class PaymentFormComponent implements OnInit {
  @Input() title: string = 'Payment';
  @Input() from: string = '';
  @Input() payment: any;
  @Input() isDiscount: boolean = false;
  @Input() isPenalty: boolean = false;
  @Input() isAdvance: boolean = false;
  @Input() PaymentList: IPayment[] = [];
  /**
   * @param 1 is for Non-VAT while 0 is for VAT
   */
  @Input() type = 0;

  setDate: boolean = false;
  paymentDate: any;
  payerName = '';
  time: any;
  all: any = 'all';
  options = {
    default: undefined,
    prefix: '₱',
    thousands: ',',
    decimal: '.',
    inputMode: CurrencyMaskInputMode.NATURAL,
  };
  Remarks: string = '';
  constructor(private activemodal: NgbActiveModal) {}
  total = 0;
  ngOnInit(): void {
    if (this.PaymentList) {
      this.total = this.PaymentList.map((d) => d.monthly).reduce(
        (a, b) => Number.parseInt(a.toString()) + Number.parseInt(b.toString())
      );
      this.payment = this.total;
    }
  }
  save() {
    let data = {
      payment: this.payment,
      remarks: this.Remarks,
      paid_by: this.payerName,
    };
    if (this.setDate) {
      data['paid_at'] = `${this.paymentDate} ${this.time}`;
    }

    this.activemodal.close(data);
  }
  close() {
    this.activemodal.close();
  }

  specificDate() {
    const now = new Date();
    this.time = date.format(now, 'HH:mm:ss');
    this.paymentDate = date.format(now, 'YYYY-MM-DD');
  }
}
