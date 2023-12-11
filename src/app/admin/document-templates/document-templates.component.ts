import { LogType } from './../../helper';
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { API, Confirm, Icon } from 'src/app/helper';
import { MainService } from 'src/app/main.service';
import { ConfirmationComponent } from 'src/app/modal/confirmation/confirmation.component';
import { GlobalToastService } from 'src/app/Toast/global-toast.service';
import { DocumentInfoComponent } from './modal/document-info/document-info.component';

@Component({
  selector: 'app-document-templates',
  templateUrl: './document-templates.component.html',
  styleUrls: ['./document-templates.component.scss'],
})
export class DocumentTemplatesComponent implements OnInit {
  templateList: [];
  lock = {
    APA: false,
    APE: false,
    APD: false,
    APAS: false,
    APES: false,
    APDS: false,
  };
  constructor(
    private service: MainService,
    private modalService: NgbModal,
    private toastService: GlobalToastService
  ) {}

  ngOnInit(): void {
    this.getAllTemplate();
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

  async getAllTemplate() {
    await this.service
      .API(API.TEMPLATE)
      .getAll()
      .toPromise()
      .then((res) => {
        this.templateList = res;
      });
  }
  newTemplate() {
    let list = [];
    this.templateList.forEach((data) => {
      list.push((data['name'] as string).split('.')[0]);
    });
    const modal = this.modalService.open(DocumentInfoComponent, { size: 'md' });

    modal.componentInstance.templateList = list;
    modal.result.then((res) => {
      console.log(res);

      this.service
        .API(API.TEMPLATE)
        .create({
          file: res.file,
          name: res.filename,
          created_by: localStorage.getItem('currentuser'),
          description: res.description,
          title: res.title,
        })
        .toPromise()
        .then((_res) => {
          console.log(_res);
          this.getAllTemplate();
        });
    });
  }
  async download(id) {
    await this.service
      .API(API.TEMPLATE)
      .getById(id)
      .toPromise()
      .then((data) => {
        console.log(data);
        const link = document.createElement('a');
        link.href = data[0].file;
        link.download = data[0].name;
        link.click();
      });
  }
  delete(data) {
    const confmdal = this.modalService.open(ConfirmationComponent);
    confmdal.componentInstance.ConfirmationType = Confirm.DELETE;
    confmdal.componentInstance.TargetItem = data.name;
    confmdal.componentInstance.IconType = Icon.DELETE;
    confmdal.componentInstance.physicaldelete = true;
    confmdal.result.then((yes) => {
      if (yes) {
        this.service
          .API(API.TEMPLATE)
          .delete(data.id)
          .toPromise()
          .then((res) => {
            this.toastService.showSuccess(res.msg, 300);
            this.getAllTemplate();
          });
      }
    });
  }
  replace(data) {
    let origData = {};
    Object.assign(origData, data);
    const modal = this.modalService.open(DocumentInfoComponent, {
      size: 'md',
    });
    modal.componentInstance.data = data;
    modal.result.then(async (resdata) => {
      let touchedData = this.service.getTouchedItem(
        {
          file: resdata.file,
          name: resdata.filename,
          updated_by: localStorage.getItem('currentuser'),
          updated_at: this.service.CurrentDate,
          description: resdata.description,
          title: resdata.title,
        },
        origData
      );
      await this.service
        .API(API.TEMPLATE)
        .update(origData['id'], touchedData)
        .toPromise()
        .then((res) => {
          this.toastService.showSuccess(res.msg, 3000);
          console.log(LogType.REPLACE);
          this.service.saveLogs(
            LogType.REPLACE,
            API.TEMPLATE,
            origData['name']
          );
        });
    });
  }
}
