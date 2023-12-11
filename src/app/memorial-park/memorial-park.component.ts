import { MainService } from './../main.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-memorial-park',
  templateUrl: './memorial-park.component.html',
  styleUrls: ['./memorial-park.component.scss'],
})
export class MemorialParkComponent implements OnInit {
  loading = false;
  lock = {
    MPML: false,
    MPA: false,
    MPL: false,
    MPBC: false,
  };
  reroute = '';
  constructor(private service: MainService, private router: Router) {}

  ngOnInit(): void {
    this.getLock();
  }

  async getLock() {
    if (localStorage.getItem('memtarget') == undefined) {
      this.loading = true;
      this.reroute = '';
      let url = {
        MPML: 'memoriallot',
        MPA: 'apartment',
        MPL: 'lawn',
        MPBC: 'bonecrypt',
      };

      let actions = localStorage.getItem('actions');
      await new Promise(() => {
        setTimeout(() => {
          for (let l in this.lock) {
            let temp = actions.split(',').filter((d) => d.includes(l));
            this.lock[l] = temp.length > 0;
            if (this.lock[l] && this.reroute == '') {
              this.reroute = url[l];
              localStorage.setItem('memtarget', this.reroute);
            }
          }
          let apps = [];
          for (let app in this.lock) {
            if (this.lock[app]) {
              apps.push(app);
            }
          }
          this.router.navigate([`/memorialpark/${this.reroute}`]);
          localStorage.setItem('memapps', apps.join(','));
          this.loading = false;
        }, 200);
      });
    } else {
      this.router.navigate([
        `/memorialpark/${localStorage.getItem('memtarget')}`,
      ]);
      let apps = localStorage.getItem('memapps').split(',');
      for (let i in apps) {
        for (let l in this.lock) {
          if (!this.lock[l]) {
            this.lock[l] = l == apps[i];
          }
        }
      }
    }
  }
}
