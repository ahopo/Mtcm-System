import { Component, OnInit } from '@angular/core';
import { API } from 'src/app/helper';
import { MainService } from 'src/app/main.service';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
})
export class PaymentComponent implements OnInit {
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
  constructor(private service: MainService) {}

  ngOnInit(): void {
    this.getAllLogs();
  }
  async getAllLogs() {
    await this.service
      .API(API.LOGS)
      .searchByQuery(`tab=1`)
      .toPromise()
      .then((res) => {
        this.logsList = res;

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
    query.push('tab=1');
    this.selectedSection =
      this.selectedSection == 'All' ? '' : this.selectedSection;
    this.selectedType = this.selectedType == 'All' ? '' : this.selectedType;
    this.selectedUser = this.selectedUser == 'All' ? '' : this.selectedUser;
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
}
