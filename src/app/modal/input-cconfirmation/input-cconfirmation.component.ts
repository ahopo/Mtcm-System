import { LogType } from './../../helper';
import { MainService } from './../../main.service';
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { API } from 'src/app/helper';

@Component({
  selector: 'app-input-cconfirmation',
  templateUrl: './input-cconfirmation.component.html',
  styleUrls: ['./input-cconfirmation.component.scss'],
})
export class InputCconfirmationComponent implements OnInit {
  admincode: any;
  userData = {};
  @Input() ActionType: string = '';
  @Input() Section: string = '';
  constructor(
    private activemodal: NgbActiveModal,
    private service: MainService
  ) {}

  ngOnInit(): void {}

  No() {
    this.activemodal.close();
  }
  async Approve() {
    await this.getUser();
    let is_approved = this.userData['have_supervision'] == 1;
    if (is_approved) {
      this.service.saveApprovedLogs(
        LogType.APPROVED,
        this.Section,
        this.ActionType,
        `${this.userData['firstName']} ${this.userData['middleName']} ${this.userData['lastName']}`
      );
    }
    this.activemodal.close(is_approved);
  }
  async getUser() {
    await this.service
      .API(API.USER)
      .searchByQuery(`code = '${this.admincode}'`)
      .toPromise()
      .then((res) => {
        Object.assign(this.userData, res[0]);
      });
    console.log(this.userData);
  }
}
