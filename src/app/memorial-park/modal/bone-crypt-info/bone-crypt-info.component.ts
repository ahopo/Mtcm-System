import { API, IBasicTable, IBoneCrypt, LogType } from './../../../helper';
import { Component, Input, OnInit } from '@angular/core';
import { CurrencyMaskInputMode } from 'ngx-currency';
import { ModalStatus } from 'src/app/helper';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MainService } from 'src/app/main.service';
import { LookUpReferenceComponent } from 'src/app/modal/look-up-reference/look-up-reference.component';
import { WarningComponent } from 'src/app/modal/warning/warning.component';

@Component({
  selector: 'app-bone-crypt-info',
  templateUrl: './bone-crypt-info.component.html',
  styleUrls: ['./bone-crypt-info.component.scss'],
})
export class BoneCryptInfoComponent implements OnInit {
  loading = false;
  image: any;
  price: number = 0;
  clickbutton: number = 0;
  dealsData = {};
  @Input() boneData: IBoneCrypt;
  @Input() status: ModalStatus;
  modalstatus = ModalStatus;
  phaseList = [{}];
  cusid = 0;
  options = {
    default: 0.0,
    prefix: '₱',
    thousands: ',',
    decimal: '.',
    inputMode: CurrencyMaskInputMode.FINANCIAL,
  };
  owner = { name: '', id: 0 };
  ownerisremoved: boolean = false;
  constructor(
    private modalService: NgbModal,
    private activeModal: NgbActiveModal,
    private service: MainService
  ) {}

  ngOnInit(): void {
    this.getAllPhase();

    this.owner.name = this.boneData.currentOwner;
    this.owner.id = this.boneData.customer_id;
  }

  async getAllPhase() {
    this.service
      .API(API.PHASE)
      .getAll()
      .toPromise()
      .then((res) => {
        this.phaseList = res;
      });
  }
  tab(tab: number) {
    this.clickbutton = tab;
  }
  save() {
    console.log(this.boneData);
    this.activeModal.close({
      boneData: this.boneData,
      customer_id: this.cusid,
      ownerisremoved: this.ownerisremoved,
      owner: this.owner,
    });
  }
  cancel() {
    this.activeModal.close({
      boneData: null,
      customer_id: 0,
      ownerisremoved: this.ownerisremoved,
    });
  }

  async uploadVoltImage(files: string | any[]) {
    this.loading = true;
    let image: string | ArrayBuffer = await this.service.Image(files);
    if (image) this.boneData.voltimg = image;

    this.loading = false;
  }
  async getCurrentOwner() {
    let table: IBasicTable[] = [];
    await this.service
      .API(API.CUSTOMER)
      .getAll()
      .toPromise()
      .then((data) => {
        console.log(data);
        data.forEach((i) => {
          table.push({
            name: `${i.firstName} ${i.middleName} ${i.lastName}`,
            id: i.id,
          });
        });
      });

    const modal = this.modalService.open(LookUpReferenceComponent, {
      size: 'md',
    });

    modal.componentInstance.title = 'Customer List';
    modal.componentInstance.tableName = 'Full Name';
    modal.componentInstance.table = table;
    modal.result.then((data) => {
      this.owner = data;
      this.cusid = data.id;
    });
  }

  remove(boneData) {
    if (boneData.deals_id == null) {
      this.owner = { name: undefined, id: 0 };
    } else {
      const warningmodal = this.modalService.open(WarningComponent);
      warningmodal.componentInstance.isConfirmation = true;
      warningmodal.componentInstance.Message = `The owner ${
        boneData.currentOwner
      } has already paid ${this.service.numberWithCommas(
        boneData.totalpayment
      )}, Are you sure you want to continue.?`;
      warningmodal.result.then((save) => {
        if (save) {
          this.service
            .API(API.DEALS)
            .update(boneData.deals_id, { is_deleted: 1 })
            .toPromise()
            .then((res) => {
              this.service.saveLogs(
                LogType.DELETE,
                API.DEALS,
                boneData.currentOwner
              );
              this.ownerisremoved = true;
              this.owner = { name: undefined, id: 0 };
              console.log(res);
            });
        }
      });
    }
  }
}
