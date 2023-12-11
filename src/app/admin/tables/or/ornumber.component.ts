import { Helper, LogType } from './../../../helper';
import { GlobalToastService } from '../../../Toast/global-toast.service';
import { MainService } from '../../../main.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, OnInit } from '@angular/core';
import { API, Confirm, Icon } from 'src/app/helper';
import { OrNumberInfoComponent } from './modal/ornumber-info/ornumber-info.component';
import { ThrowStmt } from '@angular/compiler';
import { ConfirmationComponent } from 'src/app/modal/confirmation/confirmation.component';

@Component({
  selector: 'app-or',
  templateUrl: './ornumber.component.html',
  styleUrls: ['./ornumber.component.scss'],
})
export class ORNumberComponent implements OnInit {
  orList = [];
  progress: number = 0;
  page = 1;
  vattype = 2;
  localData = [];
  lock = {
    ATOA: false,
    ATOE: false,
    ATOD: false,
    ATOAS: false,
    ATOES: false,
    ATODS: false,
  };
  constructor(
    private modalservice: NgbModal,
    private service: MainService,
    private toastService: GlobalToastService,
    private helper: Helper
  ) {}

  ngOnInit(): void {
    this.getLock();
    this.getOR();
  }
  getLock() {
    let actions = localStorage.getItem('actions').split(',');
    for (let i in actions) {
      for (let l in this.lock) {
        if (!this.lock[l]) {
          this.lock[l] = l == actions[i];
        }
      }
    }
  }
  getOR() {
    this.service
      .API(API.OR)
      .getAll()
      .toPromise()
      .then((data) => {
        this.orList = data;
        Object.assign(this.localData, this.orList);
        this.vattype = 2;
      });
  }
  newOR() {
    const modal = this.modalservice.open(OrNumberInfoComponent);
    modal.result.then(async (res) => {
      let ii = Number.parseInt(res.fromValue);
      let j = Number.parseInt(res.toValue);
      console.log(ii, j);
      for (let i = ii; i <= j; i++) {
        let data = {};

        data['value'] = i;
        data['from_date'] = res.fromDate;
        data['to_date'] = res.toDate;
        data['created_by'] = localStorage.getItem('email');
        data['type'] = res.type;
        await this.service
          .API(API.OR)
          .create(data)
          .toPromise()
          .then((a) => {
            this.progress = ((i + 1) / j) * 100;
            if (this.progress == 100) {
              setTimeout(() => {
                this.service.saveLogs(
                  LogType.CREATE,
                  API.OR,
                  `from ${ii} to ${j}`
                );
                this.progress = 0;
                this.toastService.showSuccess(a.msg, 3000);
                this.getOR();
              }, 1000);
            }
          });
      }
    });
  }
  delete(data) {
    const confmdal = this.modalservice.open(ConfirmationComponent, {
      size: 'lg',
    });

    confmdal.componentInstance.ConfirmationType = Confirm.DELETE;
    confmdal.componentInstance.TargetItem = data.value;
    confmdal.componentInstance.IconType = Icon.DELETE;
    confmdal.result.then((res) => {
      if (res) {
        this.service
          .API(API.OR)
          .delete(data.id)
          .toPromise()
          .then((res) => {
            this.toastService.showSuccess(res.msg, 3000);
            this.getOR();
            this.service.saveLogs(LogType.DELETE, API.OR, data.value);
          });
      }
    });
  }
  async filterVat(val) {
    this.page = 1;
    if (val == 2) this.getOR();
    this.vattype = val;
    this.orList = this.localData.filter((item) => item.type == val);
  }
}
