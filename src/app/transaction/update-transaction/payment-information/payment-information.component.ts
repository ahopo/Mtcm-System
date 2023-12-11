import { Helper, PaymentType } from './../../../helper';
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CurrencyMaskInputMode } from 'ngx-currency';
import { API, IPayment } from 'src/app/helper';
import { MainService } from 'src/app/main.service';
import { PaymentFormComponent } from '../../modal/payment-form/payment-form.component';

import { GlobalToastService } from 'src/app/Toast/global-toast.service';
import Docxtemplater from 'docxtemplater';
import * as PizZip from 'pizzip';
import PizZipUtils from 'pizzip/utils/index.js';
import { saveAs } from 'file-saver';
import * as date from 'date-and-time';
import datetimeDifference from 'datetime-difference';
import { isObservable } from 'rxjs';
function loadFile(url: string, callback: (error: any, content: any) => void) {
  PizZipUtils.getBinaryContent(url, callback);
}
@Component({
  selector: 'app-payment-information',
  templateUrl: './payment-information.component.html',
  styleUrls: ['./payment-information.component.scss'],
})
export class PaymentInformationComponent implements OnInit {
  validYear = false;
  loading = false;
  WithPenaltyList: IPayment[] = [];
  Lastpaymentindex = 0;
  onPenalty = false;
  SelectedINDEX = 0;
  progress: number = 0;
  customerId: any;
  hover = false;
  paymentTerms = [];
  PAYMENTLIST: IPayment[] = [];
  paymentData: IPayment;
  memmodels: number[] = [];
  currentindex = 0;
  PRICE: 0;
  TermsRange = {
    r1: 0,
    hasDiscount: false,
    d: 0,
  };
  isInitialPayment: boolean = false;
  lock: { installment: boolean; fullpaid: boolean; addbutton: boolean } = {
    installment: false,
    fullpaid: false,
    addbutton: false,
  };
  options = {
    default: 0.0,
    prefix: '₱',
    thousands: ',',
    decimal: '.',
    inputMode: CurrencyMaskInputMode.NATURAL,
  };

  memparkList: [];
  ParkId: any;
  IdName: any;
  constructor(
    private service: MainService,
    private modalService: NgbModal,
    private toastService: GlobalToastService,
    private helper: Helper
  ) {}

  ngOnInit(): void {
    this.customerId = sessionStorage.getItem('id');
    this.reset();
    this.getMemParkData(this.customerId);
    this.getInstallment();
  }
  addDiscount() {
    const modal = this.modalService.open(PaymentFormComponent);
    modal.componentInstance.title = 'Discount';
    modal.componentInstance.payment = 0;
    modal.componentInstance.isDiscount = true;
    modal.result.then((res) => {
      if (res) {
        this.PAYMENTLIST[0].discount = res.payment;
        this.PAYMENTLIST[0].payment = this.paymentData.isInstallment
          ? this.paymentData.payment - res.payment
          : this.paymentData.price - res.payment;
        this.service.saveLogs('Discount', 'PAYMENT', res.payer);
      }
    });
  }

  reset() {
    this.SelectedINDEX = 0;
    this.WithPenaltyList = [];
    this.Lastpaymentindex = 0;
    this.onPenalty = false;
    this.SelectedINDEX = 0;
    this.paymentData = {
      isInstallment: false,
      isFullyPaid: false,
      customer_id: '',
      mem_id: 0,
      payment: 0,
      balance: 0,
      price: 0,
      penalty: 0,
      discount: 0,
      interest: 0,
      payment_terms: 0,
      remarks: '',
      isFirstDp: false,
      deals_id: 0,
      computed_balance: 0,
      monthly: 0,
      paid_at: '',
      paid_by: '',
      is_addtional_month: '0',
    };
  }

  async getInstallment() {
    await this.service
      .API(API.INSTALLMENT)
      .getAll()
      .toPromise()
      .then((res) => {
        this.paymentTerms = res;
      });
  }
  getIndex(i: number) {
    this.reset();
    this.currentindex = i;
    if (this.memparkList.length > 0) {
      this.ParkId = this.memparkList[this.currentindex]['park_id'];
      this.IdName = this.memparkList[this.currentindex]['table_id'];
      this.paymentData.price = this.memparkList[i]['price'];

      this.lock = {
        installment: false,
        fullpaid: false,
        addbutton: false,
      };
      this.getPayment();
    }
  }

  async getPayment() {
    this.PAYMENTLIST = [];
    await this.service
      .API(API.PAYMENT)
      .searchByQuery(
        `customer_id=${this.customerId}-${this.IdName}=${this.ParkId} order by paid_at`
      )
      .toPromise()
      .then((res) => (this.PAYMENTLIST = res));

    this.isInitialPayment = this.PAYMENTLIST.length == 0;
    console.log(this.isInitialPayment);
    this.paymentData.isInstallment = false;
    if (this.PAYMENTLIST.length > 0) {
      this.paymentData = this.PAYMENTLIST[0];
      this.paymentData.customer_id == this.customerId &&
        this.paymentData[this.IdName] == this.ParkId;
    }

    if (!this.isInitialPayment && this.paymentData.isInstallment) {
      this.setButtons();
      this.checkDate();
    } else if (this.isInitialPayment) {
      this.PAYMENTLIST = [
        {
          isInstallment: false,
          isFullyPaid: false,
          customer_id: '0',
          payment: this.paymentData.price,
          balance: 0,
          price: this.paymentData.price,
          penalty: 0,
          discount: 0,
          interest: this.paymentData.interest,
          payment_terms: this.paymentData.payment_terms,
          isFirstDp: true,
          deals_id: this.memparkList[this.currentindex]['deals_id'],
          computed_balance: 0,
          monthly: this.paymentData.price,
          paid_at: '',
          paid_by: '',
          process_by: localStorage.getItem('email'),
          is_addtional_month: '0',
        },
      ];
      this.PAYMENTLIST[0]['ShowPenalty'] = false;
      this.PAYMENTLIST[0]['ShowCurrent'] = false;
      this.PAYMENTLIST[0]['ShowAdvance'] = false;
    }
  }
  setButtons() {
    this.PAYMENTLIST.forEach((data: IPayment, i: number) => {
      let ShowPenalty = false;
      let ShowCurrent = false;
      let ShowAdvance = false;
      if (!(data.penalty > 0)) {
        let paidYear = date.parse(data.paid_at, 'YYYY-MM-DD').getFullYear();
        let paidAt = date.parse(data.paid_at, 'YYYY-MM-DD');
        let today = new Date();
        let { years, months, days } = datetimeDifference(paidAt, today);
        let dateDiff = datetimeDifference(paidAt, today);
        let paidMonth = date.parse(data.paid_at, 'YYYY-MM-DD').getMonth() + 1;
        let currentYear = parseInt(this.service.CurrentYear);
        let currentMonth = parseInt(this.service.CurrentMonth);
        let hasDiff = years * 12 + months + days > 0;

        console.log(hasDiff, dateDiff);
        if (hasDiff) {
          if (currentMonth > paidMonth && currentYear >= paidYear) {
            ShowPenalty = true;
            this.setPenalty(data, i, true);
          } else {
            ShowAdvance = true;
          }
        } else {
          ShowCurrent = true;
        }
      } else {
        ShowPenalty = true;
      }
      data['ShowPenalty'] = ShowPenalty;
      data['ShowCurrent'] = ShowCurrent;
      data['ShowAdvance'] = ShowAdvance;
    });
  }
  async getMemParkData(id) {
    await this.service
      .API(API.PARKDATA)
      .getById(id)
      .toPromise()
      .then((data) => {
        this.memparkList = data;
        this.memparkList.forEach((d, i) => {
          this.memmodels.push(i);
        });
        this.getIndex(0);
      });
  }
  addPadding(val: string) {
    try {
      return val.padStart(7, '0');
    } catch (error) {
      return '0000000';
    }
  }
  computePayment() {
    this.PAYMENTLIST = [];
    let value = this.paymentData.payment;
    let r1 = this.TermsRange.r1;
    let discount = 0;
    if (value >= r1 && this.TermsRange.hasDiscount) {
      discount = this.TermsRange.d;
    }
    let DPdiff = this.paymentData.price - this.paymentData.payment;
    let discounted = DPdiff - discount;
    let monthlypayment =
      discounted / this.paymentData.payment_terms +
      (discounted / this.paymentData.payment_terms) * this.paymentData.interest;
    let comBalance = Math.round(
      monthlypayment * this.paymentData.payment_terms
    );
    this.paymentData.computed_balance = comBalance;

    this.paymentData.monthly = Math.round(monthlypayment);
    let today = new Date();
    this.PAYMENTLIST = [
      {
        isInstallment: true,
        isFullyPaid: false,
        customer_id: this.customerId,
        payment: this.paymentData.payment - discount,
        balance: comBalance,
        price: this.paymentData.price,
        penalty: 0,
        discount: discount,
        interest: this.paymentData.interest,
        payment_terms: this.paymentData.payment_terms,
        isFirstDp: true,
        deals_id: this.memparkList[this.currentindex]['deals_id'],
        computed_balance: comBalance,
        monthly: 0,
        paid_at: date.format(today, 'YYYY-MM-DD'),
        paid_by: '',
        process_by: localStorage.getItem('email'),

        is_addtional_month: '0',
      },
    ];

    for (let i = 0; i < this.paymentData.payment_terms; i++) {
      today.setMonth(today.getMonth() + 1);
      this.PAYMENTLIST.push({
        isInstallment: true,

        isFullyPaid: false,
        customer_id: this.customerId,
        mem_id: 0,
        payment: 0,
        balance: comBalance,
        price: this.paymentData.price,
        penalty: 0,
        discount: 0,
        interest: 0,
        payment_terms: 0,
        remarks: '',
        isFirstDp: false,
        deals_id: this.memparkList[this.currentindex]['deals_id'],
        computed_balance: comBalance,
        monthly: Math.round(monthlypayment),
        paid_at: date.format(today, 'YYYY-MM-DD hh:mm:ss'),
        paid_by: '',
        process_by: localStorage.getItem('email'),

        is_addtional_month: '0',
      });
    }
  }

  async addpayment() {
    const modal = this.modalService.open(PaymentFormComponent, { size: 'md' });

    let isInitial = this.isInitialPayment;
    let isInstall = this.paymentData.isInstallment;
    modal.componentInstance.from = 'main';
    if (isInstall && !this.onPenalty) {
      modal.componentInstance.title = isInitial
        ? 'Downpayment'
        : 'Monthly Payment';
      modal.componentInstance.payment = this.PAYMENTLIST[0].payment;
    } else if (!isInstall && !this.onPenalty) {
      modal.componentInstance.title = 'Payment';
      modal.componentInstance.payment = this.PAYMENTLIST[0].payment;
    } else {
      modal.componentInstance.title = 'Monthly payment with penalty';
      modal.componentInstance.payment =
        this.PAYMENTLIST[this.SelectedINDEX].payment;
      modal.componentInstance.isPenalty = true;
    }
    await modal.result.then((res) => {
      if (res) {
        if (this.onPenalty) {
          this.newPaymentWithPenalty(res);
        } else {
          this.newPayment(res, isInitial, isInstall);
        }
      }
    });
  }
  async newPayment(
    res: { paid_by: any; remarks: string; payment: any },
    isInitial: boolean,
    isInstall: boolean
  ) {
    let paid_by = res.paid_by;
    let ordata = await this.service.getOR(0);
    if (isInitial && isInstall) {
      this.PAYMENTLIST[0]['paid_by'] = paid_by;
      this.PAYMENTLIST[0]['remarks'] = res.remarks;
      this.PAYMENTLIST[0]['or_number'] = ordata.value;
      this.PAYMENTLIST.forEach(async (item, i) => {
        this.PAYMENTLIST[i][this.IdName] = this.ParkId;
        await this.service
          .API(API.PAYMENT)
          .create(item)
          .toPromise()
          .then((res) => {
            if (i == 0) {
              this.service.savePaymentLogs(
                PaymentType.RECIEVED,
                PaymentType.RECIEVED,
                'MAIN PAYMENT',
                `${this.memparkList[this.currentindex]['phase']} BLK ${
                  this.memparkList[this.currentindex]['block']
                } LT ${this.memparkList[this.currentindex]['lot']}`,
                this.PAYMENTLIST[0].discount.toString(),
                this.PAYMENTLIST[0].payment,
                paid_by
              );
            }
            this.progress = ((i + 1) / this.PAYMENTLIST.length) * 100;
            if (this.progress == 100) {
              setTimeout(async () => {
                this.progress = 0;
                this.toastService.showSuccess(res.msg, 3000);
                await this.service.updateOR(ordata);
                this.getPayment();
              }, 1000);
            }
          })
          .catch((err) => {
            console.error(err);
          });
      });
    } else if (isInitial && !isInstall) {
      let data = {
        paid_by: paid_by,
        remarks: res.remarks,
        or_number: ordata.value,
        payment: res.payment,
        discount: this.PAYMENTLIST[0].discount,
        isFullyPaid: 1,
        process_by: localStorage.getItem('email'),
        customer_id: sessionStorage.getItem('id'),
        deals_id: this.PAYMENTLIST[0].deals_id,
        price: this.paymentData.price,
      };
      data[this.IdName] = this.ParkId;
      this.service
        .API(API.PAYMENT)
        .create(data)
        .toPromise()
        .then(async (res) => {
          this.service.savePaymentLogs(
            PaymentType.RECIEVED,
            PaymentType.RECIEVED,
            'MAIN PAYMENT',
            `${this.memparkList[this.currentindex]['phase']} BLK ${
              this.memparkList[this.currentindex]['block']
            } LT ${this.memparkList[this.currentindex]['lot']}`,
            this.PAYMENTLIST[0] == undefined
              ? '0'
              : this.PAYMENTLIST[0].discount.toString(),
            this.PAYMENTLIST[0] == undefined
              ? '0'
              : this.PAYMENTLIST[0].payment,
            paid_by
          );

          this.toastService.showSuccess(res.msg, 3000);
          await this.service.updateOR(ordata);
          this.getPayment();
        });
    }
  }
  checkIntialPayment() {
    if (this.paymentData.isInstallment) {
      this.PAYMENTLIST = [];
    } else {
      this.getIndex(this.currentindex);
    }
  }
  async updatePayment(paymentdata: IPayment, index: number) {
    try {
      if (!(this.PAYMENTLIST[index - 1].payment > 0)) {
        const modal = this.modalService.open(PaymentFormComponent, {
          size: 'xl',
        });
        modal.componentInstance.initialPayment = false;
        modal.componentInstance.installment = true;
        modal.componentInstance.payment = paymentdata.monthly;
        modal.componentInstance.isAdvance = true;

        let SelectedPayment = this.PAYMENTLIST.filter(
          (d, i, r) => i <= index && d.or_number == null
        );
        let hasPenalty = SelectedPayment.some((a) => a.penalty > 0);
        modal.componentInstance.title = hasPenalty
          ? 'Payment with penalty'
          : 'Advance Payment';
        modal.componentInstance.PaymentList = SelectedPayment;
        await modal.result.then((res) => {
          if (!res) {
            this.getPayment();
          } else {
            SelectedPayment.forEach(async (data, i) => {
              let paid_by = res.paid_by;
              let remarks = res.remarks;
              let ordata = await this.service.getOR(0);
              let lasindex = i == SelectedPayment.length - 1;
              console.log('OR_DATA', ordata);
              let paymentData = {
                or_number: 0,
                updated_at: this.service.CurrentDate,
                updated_by: this.service.CurrentUserFullname,
                paid_by: paid_by,
                remarks: remarks,
                payment: 0,
              };

              if (lasindex) {
                paymentData.payment = res.payment;
                paymentData.or_number = ordata.value;
              }

              this.service
                .API(API.PAYMENT)
                .update(data.id, paymentData)
                .toPromise()
                .then(async (res) => {
                  if (lasindex) {
                    this.service.savePaymentLogs(
                      PaymentType.RECIEVED,
                      PaymentType.ADVANCED,
                      'MAIN PAYMENT',
                      `${this.memparkList[this.currentindex]['phase']} BLK ${
                        this.memparkList[this.currentindex]['block']
                      } LT ${this.memparkList[this.currentindex]['lot']}`,
                      '0',
                      paymentData.payment,
                      paid_by
                    );

                    this.service.updateOR(ordata);
                    let newbalance =
                      this.PAYMENTLIST.filter((d) => d.id == data.id).map(
                        (d) => d.balance
                      )[0] - paymentData.payment;

                    this.updateBalance(newbalance, index);
                    this.toastService.showSuccess(res.msg, 3000);
                  }
                });
            });
          }
        });
      } else {
        const modal = this.modalService.open(PaymentFormComponent);
        modal.componentInstance.initialPayment = false;
        modal.componentInstance.installment = true;
        modal.componentInstance.payment = paymentdata.monthly;
        modal.result.then(async (data) => {
          if (data) {
            let ordata = await this.service.getOR(0);
            let paid_by = data.paid_by;
            let remarks = data.remarks;
            this.service
              .API(API.PAYMENT)
              .update(paymentdata.id, {
                payment: paymentdata.monthly,
                or_number: ordata.value,
                updated_at: this.service.CurrentDate,
                updated_by: this.service.CurrentUserFullname,
                paid_by: paid_by,
                remarks: remarks,
              })
              .toPromise()
              .then((res) => {
                this.service.savePaymentLogs(
                  PaymentType.RECIEVED,
                  PaymentType.RECIEVED,
                  'MAIN PAYMENT',
                  `${this.memparkList[this.currentindex]['phase']} BLK ${
                    this.memparkList[this.currentindex]['block']
                  } LT ${this.memparkList[this.currentindex]['lot']}`,
                  '0',
                  paymentdata.monthly,
                  paid_by
                );
                let newbalance = paymentdata.balance - paymentdata.monthly;
                this.updateBalance(newbalance, index);
                this.service.updateOR(ordata);
                this.getPayment();
                this.toastService.showSuccess(res.msg, 1000);
              });
          }
        });
      }
    } catch (error) {}
  }

  async updateBalance(balanceval, index) {
    try {
      for (let i = index; i <= this.PAYMENTLIST.length; i++) {
        console.log(index, this.PAYMENTLIST.length);
        await this.service
          .API(API.PAYMENT)
          .update(this.PAYMENTLIST[i].id, { balance: balanceval })
          .toPromise()
          .then((res) => {
            console.log('balance update', res);
          });
        if (this.service.lastIndex(this.PAYMENTLIST, i)) {
          this.getPayment();
        }
      }
    } catch (error) {}
  }
  getPaymentTermsData() {
    let data = this.paymentTerms.filter(
      (a) => a['months'] == this.paymentData.payment_terms
    )[0];

    this.TermsRange.r1 = data['fromvalue'];
    this.TermsRange.hasDiscount = data['hasDiscount'] == 1;
    this.TermsRange.d = data['dsvalue'];
    this.paymentData.interest = data['interest'];
    this.computePayment();
  }

  async getDataAndGenerate(deals_id, ornumber) {
    // construction_template.docx

    await this.service
      .API(API.TEMPLATE)
      .searchByQuery("`name` = 'main_receipt_template.docx'")
      .toPromise()
      .then(async (data) => {
        let template = data[0];
        await this.service
          .API(API.TEMPDATA)
          .searchByQuery(`id=${deals_id}-or_number=${ornumber}`)
          .toPromise()
          .then((data) => {
            this.generateTemplate(
              `${data[0]['cusFullname']}${template.title}${ornumber}.docx`,
              data[0],
              template.id
            );
          });
      });
  }

  async generateTemplate(fileName, data, temp_id) {
    let path = '';
    await this.service
      .API(API.TEMPLATE)
      .getById(temp_id)
      .toPromise()
      .then((response) => {
        path = response[0]['path'];
      });
    loadFile(path.replace('\\', '/'), (error: any, content: any) => {
      if (error) {
        throw error;
      }
      let zip = new PizZip(content);
      let doc = new Docxtemplater().loadZip(zip);

      doc.setData(data);
      try {
        // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
        doc.render();
      } catch (error) {
        // The error thrown here contains additional information when logged with JSON.stringify (it contains a properties object containing all suberrors).
        function replaceErrors(key: any, value: { [x: string]: any }) {
          if (value instanceof Error) {
            return Object.getOwnPropertyNames(value).reduce(function (
              error,
              key
            ) {
              error[key] = value[key];
              return error;
            });
          }
          return value;
        }

        if (error.properties && error.properties.errors instanceof Array) {
          const errorMessages = error.properties.errors
            .map(function (error: { properties: { explanation: any } }) {
              return error.properties.explanation;
            })
            .join('\n');
          console.log('errorMessages', errorMessages);
        }
        throw error;
      }
      var out = doc.getZip().generate({
        type: 'blob',
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }); //Output the document using Data-URI
      saveAs(out, fileName);
    });
  }
  async applyPenalty(paymentData) {
    if (!this.onPenalty) {
      this.WithPenaltyList = [];
      this.onPenalty = true;
      let SelectedINDEX = this.PAYMENTLIST.findIndex(
        (data) => data.id == paymentData.id
      );

      this.WithPenaltyList = this.PAYMENTLIST.filter(
        (d, i) =>
          i <= SelectedINDEX && !(d.penalty > 0) && d.or_number == undefined
      );
      this.WithPenaltyList.forEach((data, i) => {
        let origindex = this.PAYMENTLIST.findIndex((d) => d.id == data.id);
        try {
          let pastBal = Math.round(this.PAYMENTLIST[origindex - 1].balance);
          let penalty = Math.round((pastBal * 0.1) / 12);
          let balanceWpenalty = pastBal + penalty;
          let monthlyWpenalty =
            Math.round(this.PAYMENTLIST[origindex].monthly) + penalty;

          if (i != this.WithPenaltyList.length - 1) {
            this.WithPenaltyList[i].penalty = penalty;
            this.WithPenaltyList[i].monthly = monthlyWpenalty;
            this.WithPenaltyList[i].balance = balanceWpenalty;
            this.WithPenaltyList[i + 1].balance = balanceWpenalty;
          }
        } catch (err) {}
      });
      const modal = this.modalService.open(PaymentFormComponent, {
        size: 'xl',
      });
      modal.componentInstance.initialPayment = false;
      modal.componentInstance.installment = true;
      modal.componentInstance.isPenalty = true;
      modal.componentInstance.title = 'Payment with penalty';

      modal.componentInstance.PaymentList = this.WithPenaltyList;
      modal.result.then((res) => {
        console.log('Close Penalty', res);
        if (!res) {
          this.getPayment();
          this.onPenalty = false;
        }
        if (res.applyPenalty) {
          this.WithPenaltyList.forEach(async (payment, i) => {
            await this.service
              .API(API.PAYMENT)
              .update(payment.id, {
                monthly: payment.monthly,
                penalty: payment.penalty,
                updated_at: this.service.CurrentDate,
                updated_by: this.service.CurrentUserFullname,
                [this.IdName]: this.ParkId,
                balance: payment.balance,
              })
              .toPromise()
              .then((res) => {
                if (this.service.lastIndex(this.WithPenaltyList, i)) {
                  this.getPayment();
                  this.onPenalty = false;
                }
              });
          });
        } else {
          this.WithPenaltyList.forEach(async (data, i) => {
            let paid_by = res.paid_by;
            let remarks = res.remarks;
            let ordata = await this.service.getOR(0);
            let lasindex = i == this.WithPenaltyList.length - 1;
            console.log('OR_DATA', ordata);
            let paymentData = {
              or_number: 0,
              updated_at: this.service.CurrentDate,
              updated_by: this.service.CurrentUserFullname,
              paid_by: paid_by,
              remarks: remarks,
              penalty: data.penalty,
              payment: 0,
              balance: data.balance,
            };

            if (lasindex) {
              paymentData.payment = res.payment;
              paymentData.or_number = ordata.value;
            }

            this.service
              .API(API.PAYMENT)
              .update(data.id, paymentData)
              .toPromise()
              .then(async (res) => {
                if (lasindex) {
                  this.service.savePaymentLogs(
                    PaymentType.RECIEVED,
                    PaymentType.PENALTY,
                    'MAIN PAYMENT',
                    `${this.memparkList[this.currentindex]['phase']} BLK ${
                      this.memparkList[this.currentindex]['block']
                    } LT ${this.memparkList[this.currentindex]['lot']}`,
                    '0',
                    paymentData.payment,
                    paid_by
                  );

                  this.service.updateOR(ordata);
                  let newbalance = data.balance - paymentData.payment;
                  this.updateBalance(
                    newbalance,
                    this.PAYMENTLIST.findIndex((d) => d.id == data.id)
                  );
                  this.toastService.showSuccess(res.msg, 3000);
                }
              });
          });
        }
      });
    }
  }

  async newPaymentWithPenalty(res) {
    let lastitem = false;

    let paid_by = res.paid_by;
    let remarks = res.remarks;
    let ordata: {};
    this.WithPenaltyList.forEach(async (data, i) => {
      lastitem =
        this.SelectedINDEX ==
        this.PAYMENTLIST.findIndex((d) => d.id == data.id);
      data.updated_at = this.service.CurrentDate;
      data.updated_by = this.service.CurrentUserFullname;
      data.paid_by = this.service.CurrentUserFullname;
      data.remarks = remarks;
      data['or_number'] = 0;

      if (lastitem) {
        ordata = await this.service.getOR(0);
        data['or_number'] = ordata['value'];
      }
      delete data.process_at;
      delete data.paid_at;
      await this.service
        .API(API.PAYMENT)
        .update(data.id, data)
        .toPromise()
        .then(async (res) => {
          this.progress = ((i + 1) / this.WithPenaltyList.length) * 100;

          if (lastitem) {
            this.progress = 0;
            this.service.savePaymentLogs(
              PaymentType.RECIEVED,
              PaymentType.RECIEVED,
              'MAIN PAYMENT',
              `${this.memparkList[this.currentindex]['phase']} BLK ${
                this.memparkList[this.currentindex]['block']
              } LT ${this.memparkList[this.currentindex]['lot']}`,
              '0',
              data.payment,
              paid_by
            );
            await this.service.updateOR(ordata['value']);
            let newbalance =
              this.PAYMENTLIST[this.SelectedINDEX].balance - data.payment;
            this.updateBalance(newbalance, this.SelectedINDEX);
            this.getPayment();
            this.toastService.showSuccess(res.msg, 3000);
          }
        });
    });

    this.onPenalty = false;
    this.WithPenaltyList = [];
  }
  changeElemenet(id) {
    // setTimeout(() => {
    console.log(`id_${id}`);
    let penaltybutton = <HTMLButtonElement>document.getElementById(`id_${id}`);
    penaltybutton.className =
      'btn btn-outline-danger font-weight-bold btn-sm flex-fill';
    penaltybutton.innerHTML = 'Cancel';
    penaltybutton.addEventListener('click', () => {
      this.getPayment();
      this.onPenalty = false;
      this.SelectedINDEX = 0;
    });
    let editpenalty = <HTMLButtonElement>(
      document.getElementById(`edit_id_${id}`)
    );
    editpenalty.remove();
    // }, 100);
  }
  async checkDate() {
    let paidAt = date.parse(
      this.PAYMENTLIST.slice(-1)[0].paid_at.split('T')[0],
      'YYYY-MM-DD'
    );
    let today = new Date();
    let datediff = datetimeDifference(paidAt, today);
    let diff = datediff.months + datediff.years * 12;

    if (paidAt.getFullYear() <= today.getFullYear() && diff > 0) {
      let newPenalty = await this.additionalMonth(
        diff,
        paidAt,
        this.PAYMENTLIST.slice(-1)[0]
      );
      if (newPenalty) {
        await this.ApplyPenalty();
      }
    }
  }
  async additionalMonth(diff: number, paidAt: Date, d: IPayment) {
    return new Promise<boolean>((r) => {
      setTimeout(async () => {
        delete d['updated_at'];
        delete d['or_number'];
        delete d['id'];
        let i: number;
        for (i = 0; i < diff; i++) {
          paidAt.setMonth(paidAt.getMonth() + 1);
          console.log(date.format(paidAt, 'YYYY-MM-DD'));
          d.paid_at = date.format(paidAt, 'YYYY-MM-DD');
          await this.service
            .API(API.PAYMENT)
            .create(d)
            .toPromise()
            .then((r) => {
              console.log(r.msg);
            });
        }
        r(i == diff);
      }, 200);
    });
  }
  ApplyPenalty() {
    return new Promise<boolean>((r) => {
      setTimeout(() => {
        this.PAYMENTLIST.map((d, i) => {
          if (d.or_number == undefined && !(d.penalty > 0)) {
            this.setPenalty(d, i, true);
          }
        });
        return r(this.PAYMENTLIST.filter((d) => !(d.penalty > 0)).length == 0);
      }, 200);
    });
  }
  async setPenalty(d: IPayment, i: number, update: boolean) {
    //penalty computation
    let pastBal = Math.round(this.PAYMENTLIST[i - 1].balance);
    let penalty = Math.round((pastBal * 0.1) / 12);
    let balanceWpenalty = pastBal + penalty;
    let monthlyWpenalty = Math.round(this.PAYMENTLIST[i].monthly) + penalty;
    //apply penalty computation
    d.penalty = penalty;
    d.monthly = monthlyWpenalty;
    d.balance = balanceWpenalty;
    //update to database
    if (update) {
      delete d['updated_at'];
      delete d['or_number'];
      await this.service
        .API(API.PAYMENT)
        .update(d.id, d)
        .toPromise()
        .then((r) => {
          console.log(r.msg);
        });
    }
  }
}
