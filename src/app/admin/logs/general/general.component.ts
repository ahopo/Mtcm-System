import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { API, Confirm, Icon } from 'src/app/helper';
import { MainService } from 'src/app/main.service';
import { ConfirmationComponent } from 'src/app/modal/confirmation/confirmation.component';
import { GlobalToastService } from 'src/app/Toast/global-toast.service';
@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.scss'],
})
export class GeneralComponent implements OnInit {
  page = 1;
  logsList = [];
  TypeList = [];
  SectionList = [];
  selectedType = '';
  selectedSection = '';
  selectedUser = '';
  origLogsList = [];
  userList = [];
  fromDate: string = '';
  toDate: string = '';
  constructor(
    private service: MainService,
    private modalservice: NgbModal,
    private toastService: GlobalToastService
  ) {}

  ngOnInit(): void {
    this.getAllLogs();
  }
  async getAllLogs() {
    await this.service
      .API(API.LOGS)
      .searchByQuery(`tab=0`)
      .toPromise()
      .then((res) => {
        this.logsList = res;
        console.log('list of logs', res, this.logsList);
        Object.assign(this.origLogsList, res);
        this.TypeList = [
          ...new Set(this.origLogsList.map((item) => item.type)),
        ];
        this.SectionList = [
          ...new Set(this.origLogsList.map((item) => item.section)),
        ];
        this.userList = [
          ...new Set(this.origLogsList.map((item) => item.user_fullname)),
        ];
      });
  }

  async filter() {
    let query = [];
    query.push('tab=0');
    this.selectedSection =
      this.selectedSection == 'All' ? '' : this.selectedSection;
    this.selectedType = this.selectedType == 'All' ? '' : this.selectedType;
    this.selectedUser = this.selectedUser == 'All' ? '' : this.selectedUser;
    query.push(`tab='general'`);
    if (this.selectedSection != '') {
      query.push(`section='${this.selectedSection.toLowerCase()}'`);
    }
    if (this.selectedType != '') {
      query.push(`type='${this.selectedType.toLowerCase()}'`);
    }
    if (this.selectedUser != '') {
      query.push(`user_fullname='${this.selectedUser}'`);
    }
    let from = this.fromDate.replace('-', ',').replace('-', ',');
    let to = this.toDate.replace('-', ',').replace('-', ',');

    if (this.toDate != '' && this.fromDate != '') {
      query.push(`created_at between '${from}' and '${to}'`);
    }
    if (query.length > 0) {
      await this.service
        .API(API.LOGS)
        .searchByQuery(query.join('-'))
        .toPromise()
        .then((data) => {
          console.log(data);
          this.logsList = data;
        });
    } else {
      this.getAllLogs();
    }
  }
  clearfilter() {
    this.fromDate = '';
    this.toDate = '';
    this.selectedType = '';
    this.selectedSection = '';
    this.getAllLogs();
  }

  delete(data) {
    const confmdal = this.modalservice.open(ConfirmationComponent);
    let target = `Section : ${data.section}, Type: ${data.type}`;
    confmdal.componentInstance.ConfirmationType = Confirm.DELETE;
    confmdal.componentInstance.TargetItem = `Section : ${data.section}, Type: ${data.type}`;
    confmdal.componentInstance.IconType = Icon.DELETE;
    confmdal.componentInstance.physicaldelete = true;
    confmdal.result.then((res) => {
      this.service
        .API(API.LOGS)
        .delete(data.id)
        .toPromise()
        .then((res) => {
          this.getAllLogs();
          this.toastService.showSuccess(res.msg, 3000);
        });
    });
  }
}
