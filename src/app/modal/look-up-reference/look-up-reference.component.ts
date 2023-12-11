import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IBasicTable } from 'src/app/helper';

@Component({
  selector: 'app-look-up-reference',
  templateUrl: './look-up-reference.component.html',
  styleUrls: ['./look-up-reference.component.scss'],
})
export class LookUpReferenceComponent implements OnInit {
  @Input() table: IBasicTable[];
  @Input() tableName: string;
  @Input() title: string;
  search: string = '';
  localData: IBasicTable[] = [];
  page=1;
  constructor(private activemodal: NgbActiveModal) {}

  ngOnInit(): void {
    Object.assign(this.localData, this.table);
  }

  close() {
    this.activemodal.close();
  }

  searchName() {
    this.page=1;
    if (this.search != '') {
      this.table = this.localData.filter((data) => data.name.toLowerCase().includes(this.search.toLowerCase()));
    } else {
      this.table = this.localData;
    }
  }
  select(data) {
    this.activemodal.close(data);
  }
}
