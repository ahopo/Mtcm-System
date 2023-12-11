import { LogType } from './../../../helper';
import { WarningComponent } from './../../../modal/warning/warning.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, OnInit } from '@angular/core';
import { API, Confirm, Icon } from 'src/app/helper';
import { MainService } from 'src/app/main.service';
import { ConfirmationComponent } from 'src/app/modal/confirmation/confirmation.component';
import { GlobalToastService } from 'src/app/Toast/global-toast.service';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
})
export class CreateComponent implements OnInit {
  groupList = [];
  origData = {};
  checkall = false;
  ROLES: any[] = [];
  groupData: { name: any; description: any; functions: any };
  functionid: any[] = [];
  function: any[] = [];
  private _ROLES: any[] = [];
  page = 1;
  areaname: string;
  selectedname = '';
  rolesName: any[];
  onEdit: boolean;
  actionslist = ['add', 'view', 'edit', 'delete', 'generate'];
  selectedaction = '';
  searchVal: string;
  lock = {
    AGA: false,
    AGV: false,
    AGE: false,
    AGD: false,
    AGAS: false,
    AGES: false,
    AGDS: false,
  };
  constructor(
    private service: MainService,
    private modalservice: NgbModal,
    private toastService: GlobalToastService
  ) {
    this.groupData = { name: '', description: '', functions: '' };
  }

  ngOnInit(): void {
    this.getRoles();
    this.getAllGroups();
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
  async getRoles() {
    await this.service
      .API(API.ROLES)
      .getAll()
      .toPromise()
      .then((data) => {
        this.ROLES = data;
        Object.assign(this._ROLES, data);
      });
    this.getRolesName();
  }
  search() {
    if (this.searchVal != '') {
      this.page = 1;
      this.selectedaction = '';
      this.selectedname = '';
      this.ROLES = this._ROLES.filter((data) =>
        data.description.includes(this.searchVal)
      );
    } else {
      this.ROLES = this._ROLES;
    }
  }
  filter() {
    this.searchVal = '';
    this.page = 1;
    console.log(
      'selectedname',
      this.selectedname,
      'selectedaction',
      this.selectedaction
    );
    if (this.selectedname != '' && this.selectedaction == '') {
      this.ROLES = this._ROLES.filter((data) => data.name == this.selectedname);
    }
    if (this.selectedname == '' && this.selectedaction != '') {
      this.ROLES = this._ROLES.filter((data) =>
        data.description.includes(this.selectedaction)
      );
    }
    if (this.selectedname != '' && this.selectedaction != '') {
      this.ROLES = this._ROLES.filter(
        (data) =>
          data.description.includes(this.selectedaction) &&
          data.name == this.selectedname
      );
    }
    if (this.selectedname == '' && this.selectedaction == '') {
      this.getRoles();
    }

    this.allIsCheck();
  }
  getRolesName() {
    this.rolesName = [...new Set(this.ROLES.map((item) => item.name))];
  }
  createGroup() {
    this.service
      .API(API.GROUP)
      .create(this.groupData)
      .toPromise()
      .then((data) => {
        this.service.saveLogs(LogType.CREATE, API.GROUP, this.groupData.name);
        this.getAllGroups();
        this.toastService.showSuccess(data.msg, 300);
      });
  }
  getfunctions(id, check) {
    let admincheckbox = <HTMLInputElement>document.getElementById('admincheck');
    if (admincheckbox) {
      //the selected checkbox is the the user with admin code
    }
    if (check) {
      this.functionid.push(id);
    } else {
      this.functionid.splice(this.functionid.indexOf(id), 1);
    }
    this.groupData.functions = this.functionid.join();
  }
  checkAll() {
    try {
      let tablebody = document.getElementById('tablebody');

      let tablerow: HTMLCollection = tablebody.children;
      for (let i in tablerow) {
        let checkbox = <HTMLInputElement>tablerow[i].firstChild.firstChild;
        checkbox.click();
      }
    } catch (error) {}
  }
  allIsCheck() {
    setTimeout(() => {
      let c = 0;
      let tablebody = document.getElementById('tablebody');
      let tablerow: HTMLCollection = tablebody.children;
      try {
        for (let i in tablerow) {
          let checkbox = <HTMLInputElement>tablerow[i].firstChild.firstChild;
          if (checkbox.checked) {
            c++;
          }
        }
      } catch (error) {}
      this.checkall = tablerow.length === c;
    }, 200);
  }
  pageChanged(page) {
    this.page = page;
    this.allIsCheck();
  }
  async getAllGroups() {
    await this.service
      .API(API.GROUP)
      .getAll()
      .toPromise()
      .then((data) => {
        this.groupList = data;
      });
  }
  edit(group) {
    this.function = [];
    this.groupData = group;
    Object.assign(this.origData, group);
    this.onEdit = true;
    this.functionid = group.functions.split(',');
    group.functions.split(',').forEach((element) => {
      this.function[element] = true;
    });
    this.allIsCheck();
  }
  cancel() {
    this.groupData = { name: '', description: '', functions: [] };
    this.onEdit = false;
    this.functionid = [];
    this.function = [];
    this.checkall = false;
    this.getAllGroups();
  }
  saveEdit() {
    let touchedData = this.service.getTouchedItem(
      this.groupData,
      this.origData
    );
    this.service
      .API(API.GROUP)
      .update(this.origData['id'], touchedData)
      .toPromise()
      .then((res) => {
        for (let d in touchedData) {
          if (d != 'updated_by' && d != 'updated_at') {
            this.service.saveLogs(
              LogType.UPDATE,
              API.USER,
              `${this.groupData.name}`,
              this.origData[d],
              this.groupData[d],
              d
            );
          }
        }
        this.toastService.showSuccess(res.msg, 300);
        this.cancel();
      });
  }

  delete(group) {
    this.cancel();
    if (group['usercount'] > 0) {
      const warningmodal = this.modalservice.open(WarningComponent);
      warningmodal.componentInstance.Message = `Group ${group['name']} has ${group['usercount']} user/s.
      Please remove the user registered for this group before deleting.`;
    } else {
      const confmdal = this.modalservice.open(ConfirmationComponent, {
        size: 'lg',
      });

      confmdal.componentInstance.ConfirmationType = Confirm.DELETE;
      confmdal.componentInstance.TargetItem = group.name;
      confmdal.componentInstance.IconType = Icon.DELETE;
      confmdal.result.then(async (yes) => {
        if (yes) {
          await this.service
            .API(API.GROUP)
            .delete(group.id)
            .toPromise()
            .then((res) => {
              this.service.saveLogs(LogType.DELETE, API.GROUP, group.name);
              this.toastService.showSuccess(res.msg, 300);
              this.getAllGroups();
            });
        }
      });
    }
  }
}
