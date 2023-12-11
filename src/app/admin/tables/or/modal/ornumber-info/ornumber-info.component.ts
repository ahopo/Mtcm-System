import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, OnInit } from '@angular/core';

const date=require('date-and-time')
@Component({
  selector: 'app-ornumber-info',
  templateUrl: './ornumber-info.component.html',
  styleUrls: ['./ornumber-info.component.scss'],
})
export class OrNumberInfoComponent implements OnInit {

  data = {};
  constructor(private activemodal: NgbActiveModal) {}

  ngOnInit(): void {
    let t = new Date();
    this.data['fromDate'] = date.format(t, 'YYYY-MM-DD');
    this.computeDate();
  }
  save() {
    this.activemodal.close(this.data);
  }
  close() {
    this.activemodal.dismiss();
  }
  computeDate() {
    let today = new Date(this.data['fromDate']);
    today.setMonth(today.getMonth() +5);
    this.data['toDate'] = date.format(today, 'YYYY-MM-DD');
  }
}
