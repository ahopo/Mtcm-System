import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, OnInit } from '@angular/core';
import { API, Confirm, Icon, LogType } from 'src/app/helper';
import { MainService } from 'src/app/main.service';
import { GlobalToastService } from 'src/app/Toast/global-toast.service';
import { ConfirmationComponent } from 'src/app/modal/confirmation/confirmation.component';

import { AngularCsv } from 'angular7-csv/dist/Angular-csv';
@Component({
  selector: 'app-phase',
  templateUrl: './phase.component.html',
  styleUrls: ['./phase.component.scss'],
})
export class PhaseComponent implements OnInit {
  constructor(
    private service: MainService,
    private toastService: GlobalToastService,
    private modalService: NgbModal
  ) {}

  lock = {
    ATPA: false,
    ATPE: false,
    ATPD: false,
    ATPAS: false,
    ATPES: false,
    ATPDS: false,
  };
  origphase = {};
  phaseList = [];

  NAME = '';
  DESCRIPTION = '';
  editphase: boolean = false;
  phaseid: any;
  ngOnInit(): void {
    this.getPhases();
    this.getLock();
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
  async getPhases() {
    await this.service
      .API(API.PHASE)
      .getAll()
      .toPromise()
      .then((data) => {
        this.phaseList = data;
      });
  }
  save() {
    let data = {
      name: this.NAME,
      description: this.DESCRIPTION,
    };

    this.service
      .API(API.PHASE)
      .CheckIfExistThenCancel(
        data,
        this.phaseList.map((data) => {
          return { name: data.name, description: data.description };
        })
      )
      .create({
        name: this.NAME,
        description: this.DESCRIPTION,
        created_at: this.service.CurrentDate,
        created_by: localStorage.getItem('email'),
      })
      .toPromise()
      .then((res) => {
        this.getPhases();
        this.toastService.showSuccess(res.msg, 3000);
        this.service.saveLogs(LogType.CREATE, API.PHASE, this.NAME);
      });
  }
  edit(phase) {
    Object.assign(this.origphase, phase);
    this.editphase = true;
    this.phaseid = phase.id;
    this.NAME = phase.name;
    this.DESCRIPTION = phase.description;
  }
  async update() {
    let phasedata = {
      name: this.NAME,
      description: this.DESCRIPTION,
      updated_at: this.service.CurrentDate,
      updated_by: localStorage.getItem('email'),
    };
    let touchedData = this.service.getTouchedItem(phasedata, this.origphase);
    console.log(touchedData);
    await this.service
      .API(API.PHASE)
      .update(this.phaseid, touchedData)
      .toPromise()
      .then((res) => {
        for (let d in touchedData) {
          if (d != 'updated_by' && d != 'updated_at') {
            this.service.saveLogs(
              LogType.UPDATE,
              API.PHASE,
              `${phasedata.name}`,
              this.origphase[d],
              phasedata[d],
              d
            );
          }
        }
        this.toastService.showSuccess(res.msg, 3000);
      });
    this.editphase = false;
    this.getPhases();
    this.DESCRIPTION = '';
    this.NAME = '';
  }
  delete(phase) {
    const modal = this.modalService.open(ConfirmationComponent);
    modal.componentInstance.ConfirmationType = Confirm.DELETE;
    modal.componentInstance.TargetItem = phase.name;
    modal.componentInstance.IconType = Icon.DELETE;
    modal.result.then((res) => {
      if (res) {
        this.service
          .API(API.PHASE)
          .delete(phase.id)
          .toPromise()
          .then((res) => {
            this.service.saveLogs(LogType.DELETE, API.PHASE, phase.name);
            this.getPhases();
            this.toastService.showSuccess(res.msg, 3000);
          });
      }
    });
  }
  csvOptions = {
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalseparator: '.',
    showLabels: true,
    showTitle: true,
    title: 'PHASE LIST',
    useBom: true,
    noDownload: false,
    headers: [
      '#',
      'Phase Name',
      'Phase Description',
      'Created by',
      'Created At',
      'Updated By',
      'Updated At',
    ],
  };
  downloadCSV() {
    new AngularCsv(
      this.phaseList.map((data, i, err) => {
        return {
          index: i + 1,
          name: data.name,
          description: data.description,
          createdby: data.created_by,
          cat: data.created_at,
          upby: data.updated_by == null ? '' : data.updated_by,
          upat: data.updated_at == null ? '' : data.updated_at,
        };
      }),
      `Phase Report ${this.service.CurrentDate}`,
      this.csvOptions
    );
  }
}
