import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-deceased-form',
  templateUrl: './deceased-form.component.html',
  styleUrls: ['./deceased-form.component.scss'],
})
export class DeceasedFormComponent implements OnInit {
  @Input() title;
  form: {
    fullname: any;
    date_birth: any;
    date_death: any;
    date_buried: any;
    description;
    remarks;
  } = {
    fullname: '',
    date_birth : '',
    date_death: '',
    date_buried : '',
    description: '',
    remarks: '',
  };
  constructor(private activemodal:NgbActiveModal) {}

  ngOnInit(): void {}

  cancel(){
    this.activemodal.dismiss();
  }
  save(){
    this.activemodal.close(this.form);
  }
}
