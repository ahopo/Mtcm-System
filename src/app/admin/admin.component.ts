import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { API } from '../helper';
import { MainService } from '../main.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  loading = false;
  lock = {
    AU: false,
    AG: false,
    ATO: false,
    ATP: false,
    ATI: false,
    AP: false,
    AL: false,
  };
  reroute = '';
  constructor(private service: MainService, private router: Router) {}
  ngOnInit(): void {
    this.getLock();
  }
  async getLock() {
    console.log(localStorage.getItem('adtarget'));
    if (localStorage.getItem('adtarget') == undefined) {
      this.loading = true;
      this.reroute = '';
      let url = {
        AU: 'user',
        AG: 'group',
        ATO: 'tables/or',
        ATP: 'tables/phase',
        ATI: 'tables/installment',
        AP: 'template',
        AL: 'logs',
      };
      console.log('Start');
      let actions = await new Promise((res) => {
        setTimeout(() => {
          res(localStorage.getItem('actions'));
        }, 500);
      });
      console.log('end');
      console.log('admin actions', actions);
      for (let l in this.lock) {
        let temp = (actions as string).split(',').filter((d) => d.includes(l));
        this.lock[l] = temp.length > 0;
        if (this.lock[l] && this.reroute == '') {
          this.reroute = url[l];
          localStorage.setItem('adtarget', this.reroute);
        }
      }
      let apps = [];
      for (let app in this.lock) {
        if (this.lock[app]) {
          apps.push(app);
        }
      }
      this.router.navigate([`/admin/${this.reroute}`]);
      localStorage.setItem('adapps', apps.join(','));
      this.loading = false;
    } else {
      let apps = localStorage.getItem('adapps').split(',');
      for (let i in apps) {
        for (let l in this.lock) {
          if (!this.lock[l]) {
            this.lock[l] = l == apps[i];
          }
        }
      }

      let target = localStorage.getItem('adtarget');
      console.log('target app', target, 'LOCK', this.lock);
      this.router.navigate([`/admin/${target}`]);
    }
  }
}
