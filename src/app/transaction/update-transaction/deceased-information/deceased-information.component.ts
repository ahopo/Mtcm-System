import { DeceasedFormComponent } from './../../modal/deceased-form/deceased-form.component';
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { API, Confirm, Icon } from 'src/app/helper';
import { MainService } from 'src/app/main.service';
import { GlobalToastService } from 'src/app/Toast/global-toast.service';
import { ConfirmationComponent } from 'src/app/modal/confirmation/confirmation.component';

@Component({
  selector: 'app-deceased-information',
  templateUrl: './deceased-information.component.html',
  styleUrls: ['./deceased-information.component.scss'],
})
export class DeceasedInformationComponent implements OnInit {
  memparkList: [];
  memmodels: number[] = [];
  currentindex = 0;
  deceasedList = [];
  deals_id = 0;
  constructor(
    private service: MainService,
    private modalService: NgbModal,
    private toastService: GlobalToastService
  ) {}

  ngOnInit(): void {
    let id = sessionStorage.getItem('id');
    this.getMemParkData(id);
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
  getIndex(i: number) {
    this.deals_id = this.memparkList[i]['deals_id'];
    this.currentindex = i;
    this.getAllDeceased();
  }
  getAllDeceased() {
    this.service
      .API(API.DECEASED)
      .searchByQuery(`deals_id=${this.deals_id}`)
      .toPromise()
      .then((item) => {
        this.deceasedList = item;
      });
  }
  newDeceased() {
    let deals_id = this.memparkList[this.currentindex]['deals_id'];
    const modal = this.modalService.open(DeceasedFormComponent);
    modal.componentInstance.title = 'New Deceased';
    modal.result.then((res) => {
      res['deals_id'] = deals_id;
      this.service
        .API(API.DECEASED)
        .create(res)
        .toPromise()
        .then((res) => {
          this.toastService.showSuccess(res.msg, 3000);
          this.getAllDeceased();
        });
    });
  }
  delete(item) {
    const confmdal = this.modalService.open(ConfirmationComponent, {
      size: 'md',
    });
    confmdal.componentInstance.ConfirmationType = Confirm.DELETE;
    confmdal.componentInstance.TargetItem = ` ${item.fullname}`;
    confmdal.componentInstance.IconType = Icon.DELETE;
    confmdal.result.then((yes) => {
      if (yes) {
        this.service
          .API(API.DECEASED)
          .delete(item.id)
          .toPromise()
          .then((res) => {
            this.toastService.showSuccess(res.msg, 3000);
            this.getAllDeceased();
          });
      }
    });
  }
}
