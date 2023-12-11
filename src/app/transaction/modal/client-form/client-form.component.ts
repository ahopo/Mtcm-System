import { Input } from '@angular/core';
import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Docxtemplater from 'docxtemplater';
import * as PizZip from 'pizzip';
import PizZipUtils from 'pizzip/utils/index.js';
import { saveAs } from 'file-saver';
import { CurrencyMaskInputMode } from 'ngx-currency';
import { CameraComponent } from 'src/app/camera/camera.component';
import { MainService } from 'src/app/main.service';
import { ICustomer, CLIENTDATA } from 'src/app/helper';
function loadFile(url: string, callback: (error: any, content: any) => void) {
  PizZipUtils.getBinaryContent(url, callback);
}

@Component({
  selector: 'app-client-form',
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.scss'],
})
export class ClientFormComponent {
  @Input() client: ICustomer;
  @Input() view: boolean = false;
  @Input() edit: boolean = false;
  loading = false;
  clientImage: any;
  cdata = CLIENTDATA;
  memlot: any;
  imagePath: string | any[];
  frontIamgeURL: string | ArrayBuffer;
  backIamgeURL: string | ArrayBuffer;
  value = null;
  title = '';
  options = {
    default: undefined,
    prefix: '',
    thousands: ',',
    decimal: '.',
    inputMode: CurrencyMaskInputMode.NATURAL,
  };

  constructor(
    private activemodal: NgbActiveModal,
    private modalService: NgbModal,
    private service: MainService
  ) {}

  public frontMessage: string;
  public backMessage: string;

  async uploadFront(files: string | any[]) {
    this.loading = true;
    let image: string | ArrayBuffer = await this.service.Image(files);
    if (image) this.client.frontID = image;
    this.loading = false;
  }
  async uploadBack(files: string | any[]) {
    this.loading = true;
    let image: string | ArrayBuffer = await this.service.Image(files);
    if (image) this.client.backID = image;
    this.loading = false;
  }

  close() {
    this.activemodal.close(null);
  }
  save() {
    this.activemodal.close(this.client);
  }
  async uploadFaceImg(files: string | any[]) {
    this.loading = true;
    let image: string | ArrayBuffer = await this.service.Image(files);
    if (image) this.client.faceimg = image;
    this.loading = false;
  }
  openCamera() {
    const modal = this.modalService.open(CameraComponent, {
      size: 'lg',
    });
    modal.result.then((img) => {
      console.log(img);
      this.client.faceimg = img._imageAsDataUrl;
    });
  }
  generate(client: ICustomer) {
    loadFile(
      'assets/docxtemplate/purchase-agreement.docx',
      (error: any, content: any) => {
        if (error) {
          throw error;
        }
        let zip = new PizZip(content);
        let doc = new Docxtemplater().loadZip(zip);
        let date: Date = new Date();

        doc.setData({
          fullName: `${client.firstName} ${client.lastName}`,
          address: client.address,
          date: date.toLocaleString(),
        });
        try {
          // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
          doc.render();
        } catch (error) {
          // The error thrown here contains additional information when logged with JSON.stringify (it contains a properties object containing all suberrors).
          function replaceErrors(key: any, value: { [x: string]: any }) {
            if (value instanceof Error) {
              return Object.getOwnPropertyNames(value).reduce(function (
                error,
                key
              ) {
                error[key] = value[key];
                return error;
              });
            }
            return value;
          }

          if (error.properties && error.properties.errors instanceof Array) {
            const errorMessages = error.properties.errors
              .map(function (error: { properties: { explanation: any } }) {
                return error.properties.explanation;
              })
              .join('\n');
            console.log('errorMessages', errorMessages);
            // errorMessages is a humanly readable message looking like this :
            // 'The tag beginning with "foobar" is unopened'
          }
          throw error;
        }
        var out = doc.getZip().generate({
          type: 'blob',
          mimeType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }); //Output the document using Data-URI
        saveAs(
          out,
          `${client.firstName} ${client.lastName} purchase agreement.docx`
        );
      }
    );
  }
}
