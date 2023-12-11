import { LogType } from './../../helper';
import { API, Confirm, Icon, IUser } from 'src/app/helper';
import { MainService } from './../../main.service';
import { Component, IterableDiffers, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserformComponent } from './modal/userform/userform.component';
import { ConfirmationComponent } from 'src/app/modal/confirmation/confirmation.component';
import { GlobalToastService } from 'src/app/Toast/global-toast.service';
import { InputCconfirmationComponent } from 'src/app/modal/input-cconfirmation/input-cconfirmation.component';
@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  page = 1;
  Users: IUser[] = [];
  loading: boolean = false;
  origList = [];
  searchVal = '';
  currentUser = '';
  lock = {
    AUA: false,
    AUV: false,
    AUE: false,
    AUD: false,
    AUAS: false,
    AUES: false,
    AUDS: false,
  };
  constructor(
    private modalService: NgbModal,
    private service: MainService,
    private toastService: GlobalToastService
  ) {}
  ngOnInit(): void {
    this.getAllUsers();
    this.currentUser = localStorage.getItem('currentuser');

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

  async getAllUsers() {
    this.loading = true;
    await this.service
      .API(API.USER)
      .getAll()
      .toPromise()
      .then((data) => {
        this.Users = data;
        Object.assign(this.origList, data);
      });
  }
  create(data?: IUser, errormsg?: string) {
    const modal = this.modalService.open(UserformComponent, { size: 'xl' });
    modal.componentInstance.SelectedUser = data ? data : {};
    modal.componentInstance.newuser = true;
    if (errormsg) {
      modal.componentInstance.errormessage = errormsg;
    }
    modal.result.then((userdata: IUser) => {
      console.log(userdata);
      userdata.created_by = localStorage.getItem('currentuser');
      userdata.code = '';
      if (userdata.have_supervision == 1) {
        userdata.code = this.Code(userdata);
      }
      this.service
        .API(API.USER)
        .create(userdata)
        .toPromise()
        .then((result) => {
          userdata.id = result.res[0].insertId;

          this.toastService.showSuccess(result.msg, 3000);
          this.getAllUsers();
          this.service.saveLogs(
            LogType.CREATE,
            API.USER,
            `${userdata.firstName} ${userdata.lastName}`
          );
        })
        .catch((ermessage) => {
          if (ermessage.error.errormessage) {
            this.create(userdata, ermessage.error['errormessage']);
          }
        });
    });
  }
  Code(userdata) {
    return `${this.service.CurrentMonth}${this.Users.length}${userdata.firstName
      .charAt(0)
      .toUpperCase()}${userdata.lastName.charAt(0).toUpperCase()}${
      this.service.CurrentDay
    }`;
  }
  delete(user: IUser) {
    const confmdal = this.modalService.open(ConfirmationComponent, {
      size: 'md',
    });

    confmdal.componentInstance.ConfirmationType = Confirm.DELETE;
    confmdal.componentInstance.TargetItem = ` ${user.firstName} ${user.lastName}`;
    confmdal.componentInstance.IconType = Icon.DELETE;
    confmdal.result.then(async (res) => {
      if (res) {
        await this.service
          .API(API.USER)
          .delete(user.id)
          .toPromise()
          .then((result) => {
            this.getAllUsers();
            this.toastService.showSuccess(result.msg, 3000);
            this.service.saveLogs(
              LogType.DELETE,
              API.USER,
              `${user.firstName} ${user.lastName}`
            );
          })
          .catch((error) => {
            console.log(error);
          });
      }
    });
  }
  beforevieworedit(user: IUser, status?: string) {
    if (status) {
      if (this.currentUser == user.id) {
        this.vieworedit(user, status);
      } else {
        const confirmationmodal = this.modalService.open(
          InputCconfirmationComponent,
          { size: 'sm' }
        );
        confirmationmodal.componentInstance.ActionType = LogType.UPDATE;
        confirmationmodal.componentInstance.Section = API.USER;
        confirmationmodal.result.then((approved) => {
          console.log(approved);
          if (approved) {
            this.vieworedit(user, status);
          } else {
            this.toastService.showDanger('Invalid code', 2000);
          }
        });
      }
    } else {
      this.vieworedit(user);
    }
  }
  vieworedit(user: IUser, status?: string) {
    let origData = {};
    Object.assign(origData, user);
    const modal = this.modalService.open(UserformComponent, { size: 'xl' });
    user.password = window.atob(user.password);
    modal.componentInstance.SelectedUser = user;
    modal.componentInstance.status = status;
    modal.componentInstance.newuser = false;
    modal.result.then(async (data) => {
      delete data['groupName'];
      delete data['functions'];
      await this.service
        .API(API.USER)
        .update(user.id, this.service.getTouchedItem(user, origData))
        .toPromise()
        .then((res) => {
          this.getAllUsers();
          this.toastService.showSuccess(res.msg, 3000);
          let touchedData = this.service.getTouchedItem(user, origData);
          for (let d in touchedData) {
            if (d != 'updated_by' && d != 'updated_at') {
              this.service.saveLogs(
                LogType.UPDATE,
                API.USER,
                `${user.firstName} ${user.lastName}`,
                origData[d],
                user[d],
                d
              );
            }
          }
        });
    });
  }

  search() {
    if (this.searchVal != '') {
      this.page = 1;
      this.Users = this.origList.filter((d: IUser) =>
        `${d.firstName}${d.middleName}${d.lastName}${d.email}`
          .toLocaleLowerCase()
          .includes(this.searchVal.toLowerCase())
      );
    } else {
      this.getAllUsers();
    }
  }
}
