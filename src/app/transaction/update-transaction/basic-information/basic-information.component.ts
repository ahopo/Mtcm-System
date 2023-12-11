import { GlobalToastService } from 'src/app/Toast/global-toast.service';
import { API, IPaymentTerms } from 'src/app/helper';
import { Component, OnInit } from '@angular/core';
import { CurrencyMaskInputMode } from 'ngx-currency';
import { MainService } from 'src/app/main.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CameraComponent } from 'src/app/camera/camera.component';
import Docxtemplater from 'docxtemplater';
import * as PizZip from 'pizzip';
import PizZipUtils from 'pizzip/utils/index.js';
import { saveAs } from 'file-saver';
const date = require('date-and-time');
function loadFile(url: string, callback: (error: any, content: any) => void) {
  PizZipUtils.getBinaryContent(url, callback);
}
@Component({
  selector: 'app-basic-information',
  templateUrl: './basic-information.component.html',
  styleUrls: ['./basic-information.component.scss'],
})
export class BasicInformationComponent implements OnInit {
  memparkList = [];
  templateList = [];
  terms: { value: number; label: string }[];
  dpvalue: number;
  discount: number;
  selectedTerm: any;
  paymentTerms: IPaymentTerms[] = [];
  monthlypayment = 0.0;
  computedbalance = 0.0;
  originalprice = 300000.0;
  interest = 0.0;
  loading = false;
  options = {
    default: undefined,
    prefix: '₱',
    thousands: ',',
    decimal: '.',
    inputMode: CurrencyMaskInputMode.NATURAL,
  };
  public frontMessage: string;
  public backMessage: string;
  imagePath: string | any[];
  frontIamgeURL: string | ArrayBuffer;
  backIamgeURL: string | ArrayBuffer;
  client: any = {};
  div: string = 'basicinfo';
  original: any = {};
  constructor(
    private service: MainService,
    private modalService: NgbModal,
    private toastservice: GlobalToastService
  ) {}
  ngOnInit(): void {
    let id = sessionStorage.getItem('id');
    this.getCustomer(id);
    this.getAllTemplate();
    this.getMemParkData(id);
  }

  async getCustomer(id: any) {
    await this.service
      .API(API.CUSTOMER)
      .getById(id)
      .toPromise()
      .then((response) => {
        this.client = response[0];
        Object.assign(this.original, this.client);
      });
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
      this.client.faceimg = img._imageAsDataUrl;
    });
  }
  selectPaymentTerm() {
    this.discount = this.discount === undefined ? 0 : this.discount;
    if (this.dpvalue != undefined) {
      //date
      this.paymentTerms = [];
      let today = new Date();
      let dd = String(today.getDate()).padStart(2, '0');
      let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
      let yyyy = today.getFullYear();
      //computation
      try {
        let downpaymentdiff = this.originalprice - this.dpvalue;
        let discounted = downpaymentdiff - this.discount;
        let term = parseInt(this.selectedTerm);
        switch (this.selectedTerm) {
          case '12':
            this.interest = 0.0;
            this.monthlypayment = discounted / term;
            this.computedbalance = discounted;

            break;
          case '24':
            this.interest = 0.07;
            this.monthlypayment =
              discounted / term + (discounted / term) * this.interest;
            this.computedbalance = this.monthlypayment * term;
            break;
          case '36':
            this.interest = 0.1;
            this.monthlypayment =
              discounted / term + (discounted / term) * this.interest;
            this.computedbalance = this.monthlypayment * term;
            break;
        }
      } catch (error) {}

      for (let i = 0; i < this.selectedTerm; i++) {
        let _m = parseInt(mm) + 1 + i;
        let m = _m > 12 ? 1 : _m;
        let y = _m > 12 ? yyyy + 1 : yyyy;
        this.paymentTerms.push({
          date: `${m}/${dd}/${y}`,
          payment: this.monthlypayment,
          penalty: 0,
          balance: 0,
          remarks: 'remarks',
        });
      }
    }
  }
  selectDisplay(name) {
    this.div = name;
  }
  inputText() {
    if (this.dpvalue >= 46000 && this.dpvalue < 88000) {
      this.discount = 10000;
    } else if (this.dpvalue >= 88000 && this.dpvalue < 24000) {
      this.discount = 20000;
    } else {
      this.discount = 0;
    }
    if (this.selectedTerm) {
      this.selectPaymentTerm();
    }
  }

  async previewFront(files: string | any[]) {
    this.client.frontID = null;
    this.loading = true;
    let image: string | ArrayBuffer = await this.service.Image(files);
    if (image) this.client.frontID = image;

    this.loading = false;
  }
  async previewBack(files: string | any[]) {
    this.loading = true;
    this.client.backID = null;
    let image: string | ArrayBuffer = await this.service.Image(files);
    if (image) this.client.backID = image;
    this.loading = false;
  }

  download(data: any, _file: any, description: string) {
    if (_file == null) {
      this.toastservice.showDanger('No image found.', 2000);
      return;
    }
    const body2 = { file: _file };
    let mimeType = body2.file.match(/[^:/]\w+(?=;|,)/)[0];
    const link = document.createElement('a');
    link.href = _file;
    link.download = `${data.firstName} ${data.middleName} ${data.lastName} ${description}.${mimeType}`;
    link.click();
  }
  async getMemParkData(id) {
    await this.service
      .API(API.PARKDATA)
      .getById(id)
      .toPromise()
      .then((data) => {
        this.memparkList = data;
      });
  }
  async getDataAndGenerate(mempark, template) {
    await this.service
      .API(API.TEMPDATA)
      .getById(mempark.deals_id)
      .toPromise()
      .then((data) => {
        const now = new Date();
        const pattern = date.compile('dddd, MMMM DD YYYY');
        data[0]['currentTextDate'] = date.format(now, pattern);
        const pattern2 = date.compile('YYYY/MM/DD HH:mm:ss');
        data[0]['currentNumberDate'] = date.format(now, pattern2);

        data[0]['currentTextMonth'] = date.format(now, 'MMMM');
        data[0]['currentNumberMonth'] = date.format(now, 'MM');

        data[0]['currentNumberYear'] = date.format(now, 'YYYY');

        data[0]['currentTextDay'] = date.format(now, 'dddd');
        data[0]['currentNumberDay'] = date.format(now, 'DD');

        data[0]['currentTime'] = date.format(now, 'hh:mm:ss A');
        data[0]['currentHour'] = date.format(now, 'hh A');
        data[0]['currentMinute'] = date.format(now, 'mm');
        data[0]['currentSecond'] = date.format(now, 'ss');
        this.generateTemplate(
          `${data[0]['cusFullname']}${template.title}.docx`,
          data[0],
          template.id
        );
      });
  }

  async generateTemplate(fileName, data, temp_id) {
    let path = '';
    await this.service
      .API(API.TEMPLATE)
      .getById(temp_id)
      .toPromise()
      .then((response) => {
        path = response[0]['path'];
      });
    loadFile(path.replace('\\', '/'), (error: any, content: any) => {
      if (error) {
        throw error;
      }
      let zip = new PizZip(content);
      let doc = new Docxtemplater().loadZip(zip);

      doc.setData(data);
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
      saveAs(out, fileName);
    });
  }
  async getAllTemplate() {
    await this.service
      .API(API.TEMPLATE)
      .getAll()
      .toPromise()
      .then((data) => {
        this.templateList = data.filter(
          (item) => !(item.name as string).toLowerCase().includes('receipt')
        );
      });
  }
}
