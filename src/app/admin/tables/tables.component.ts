import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss'],
})
export class TablesComponent implements OnInit {
  constructor() {}
  lock = {
    ATO: false,
    ATP: false,
    ATI: false,
  };
  ngOnInit(): void {
    this.getLock();
  }
  getLock() {
    let apps = localStorage.getItem('adapps').split(',');
    for (let i in apps) {
      for (let l in this.lock) {
        if (!this.lock[l]) {
          this.lock[l] = l == apps[i];
        }
      }
    }
  }
}
