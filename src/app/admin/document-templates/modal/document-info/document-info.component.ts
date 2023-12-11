import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MainService } from 'src/app/main.service';

@Component({
  selector: 'app-document-info',
  templateUrl: './document-info.component.html',
  styleUrls: ['./document-info.component.scss'],
})
export class DocumentInfoComponent implements OnInit {
  @Input() templateList;
  @Input() data;
  loading = false;
  filename = '';
  file: any;
  typename = '';
  extension = '';
  description = '';

  templatetypelist = [
    { value: 'main_receipt_template', name: 'Main Receipt' },
    { value: 'purchase_template', name: 'Purchase Agreement' },
    { value: 'construction_template', name: 'Construction agreement' },
    { value: 'certificate_template', name: 'Certifacate of  ownership' },
    { value: 'construction_receipt_template', name: 'Construction Receipt' },
    { value: 'micellaneous_receipt_template', name: 'Micellaneous Receipt' },
  ];
  filterlist = [];
  constructor(
    private activemodal: NgbActiveModal,
    private service: MainService
  ) {}

  ngOnInit(): void {
    if (this.data == undefined) {
      this.templateList.forEach((data, i) => {
        this.templatetypelist.forEach((item) => {
          console.log(item.value, data, item.value == data);
          if (item.value == data) {
            console.log(
              data,
              this.templatetypelist.findIndex((x) => x.value === data)
            );
            this.templatetypelist.splice(
              this.templatetypelist.findIndex((x) => x.value === data),
              1
            );
          }
        });
      });
    } else {
      this.filename = this.data.name;
      this.description = this.data.description;
    }
  }
  async getFile(file: any) {
    this.loading = true;
    if (this.data == undefined) {
      this.extension = file[0]['name'].split('.').pop();
      this.filename = file[0]['name'];
    }
    let _file = (await this.service.Image(file)) as any;
    this.file = _file;
    this.loading = false;
  }
  save() {
    this.activemodal.close({
      filename: this.filename,
      file: this.file,
      description: this.description,
      title: this.templatetypelist.filter(
        (item) => item.value === this.filename.split('.')[0]
      )[0]['name'],
    });
  }
  close() {
    this.activemodal.dismiss();
  }

  setfileName() {
    this.filename = `${this.typename}.${this.extension}`;
  }
}
