import { LogType } from './helper';
import { API, Confirm } from 'src/app/helper';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LoginComponent } from './login/login.component';
import { MainService } from './main.service';
import { ConfirmationComponent } from './modal/confirmation/confirmation.component';
import * as date from 'date-and-time';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Mount Carmel Memorial';
  login: boolean = false;
  active = 'Transaction';
  navlist: { name: any; path: any; icon: any }[] = [];
  menu: { name: any; path: any; icon: any }[] = [];
  img: any = '';
  fullname: string = '';
  email: string = '';
  currenttime: any;
  groupName: any;
  roleList: [];
  functions: any;
  rolesName: unknown[];
  timeinterval: any;
  counter = 0;
  serverIsDown = false;
  constructor(private modalService: NgbModal, private service: MainService) {
    this.navlist = [];

    this.menu = [
      { name: 'Home', path: 'transaction', icon: 'house' },
      { name: 'Memorial Park', path: 'memorialpark', icon: 'geo-alt' },
      { name: 'Admin', path: 'admin', icon: 'gear' },
    ];
    this.timeinterval = setInterval(() => {
      let today = new Date();
      this.currenttime = date.format(today, 'dddd, MMMM DD YYYY - hh:mm:ss A');
      // this.service.API = 'check';
      // this.service
      //   .getAll()
      //   .toPromise()
      //   .then(() => {
      //     if (!this.login && this.counter == 0) {
      //       this.counter = 1;
      //       let currentuser = localStorage.getItem('currentuser');
      //       if (currentuser) {
      //         this.getUser(currentuser);
      //       } else {
      //         this.open();
      //       }
      //     }
      //   })
      //   .catch((err) => {
      //     this.login = false;
      //     this.serverIsDown = true;
      //   });
    }, 1000);
  }
  ngOnDestroy(): void {
    if (this.timeinterval) {
      clearInterval(this.timeinterval);
    }
  }
  ngOnInit(): void {
    this.login = localStorage.length >= 1;
    if (this.login) {
      this.img = localStorage.getItem('img');
      this.fullname = localStorage.getItem('fullname');
      this.email = localStorage.getItem('email');
      this.functions = localStorage.getItem('functions');
      this.groupName = localStorage.getItem('group');
      this.getLock();
    } else {
      this.open();
    }
  }
  open() {
    const modal = this.modalService.open(LoginComponent, {
      backdropClass: 'bg-success',
    });
    modal.result.then((result) => {
      result.password = btoa(result.password);
      this.service
        .API(API.USER)
        .getId(result)
        .toPromise()
        .then((res) => {
          this.getUser(res[0].id);
        })
        .catch((err) => {
          this.open();
        });
    });
  }
  getUser(id: any) {
    this.service
      .API(API.USER)
      .getById(id)
      .toPromise()
      .then((res) => {
        this.img = res[0].img;
        this.fullname =
          res[0].firstName.toUpperCase() + ' ' + res[0].lastName.toUpperCase();
        this.email = res[0].email;
        this.groupName = res[0].groupName;
        this.functions = res[0].functions;
        localStorage.setItem('img', this.img);
        localStorage.setItem('fullname', this.fullname);
        localStorage.setItem('email', this.email);
        localStorage.setItem('currentuser', id);
        localStorage.setItem('group', res[0].groupName);
        localStorage.setItem('functions', res[0].functions);
        localStorage.setItem('isAdmin', res[0].functions.includes('77'));
        this.service.saveLogs(LogType.LOGIN, 'System', this.fullname);
        this.getLock();
        this.login = true;
        this.serverIsDown = false;
        this.counter = 0;
      });
  }
  logout() {
    const confmdal = this.modalService.open(ConfirmationComponent);
    confmdal.componentInstance.ConfirmationType = Confirm.LOGOUT;
    confmdal.componentInstance.IconType = 'box-arrow-right';
    confmdal.result.then((res) => {
      if (res) {
        this.service.saveLogs(LogType.LOGOUT, 'System', this.fullname);
        this.img = '';
        this.fullname = '';
        this.email = '';
        localStorage.clear();
        sessionStorage.clear();
        this.login = false;
        this.open();
      }
    });
  }
  async getLock() {
    await this.service
      .API(API.ROLES)
      .searchByQuery(`id in (${this.functions})`)
      .toPromise()
      .then(async (data) => {
        this.navlist = [];
        let applications = [...new Set(data.map((item) => item.name))];
        localStorage.setItem('applications', applications.join(','));
        this.navlist.push(
          ...this.menu.filter((d) => applications.includes(d.name))
        );

        let actions = [...new Set(data.map((item) => item.action))];
        localStorage.setItem('actions', actions.join(','));
        setTimeout(() => {
          let ul = document.getElementById('nav');
          let first_button = <HTMLButtonElement>ul.firstChild;
          first_button.click();
        }, 100);
      });
  }
}
