import { LogType } from './../../../helper';
import { WarningComponent } from './../../../modal/warning/warning.component';
import {
  API,
  Confirm,
  IBasicTable,
  Icon,
  IMemorialLotView,
  ModalStatus,
} from 'src/app/helper';
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MainService } from 'src/app/main.service';
import { CurrencyMaskInputMode } from 'ngx-currency';
import { LookUpReferenceComponent } from 'src/app/modal/look-up-reference/look-up-reference.component';
import { ConfirmationComponent } from 'src/app/modal/confirmation/confirmation.component';
@Component({
  selector: 'app-memoriallot-info',
  templateUrl: './memoriallot-info.component.html',
  styleUrls: ['./memoriallot-info.component.scss'],
})
export class MemoriallotInfoComponent implements OnInit {
  loading = false;
  image: any;
  price: number = 0;
  clickbutton: number = 0;
  dealsData = {};
  @Input() memData: IMemorialLotView;
  @Input() status: ModalStatus;
  ownerisremoved = false;
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
  constructor(
    private modalService: NgbModal,
    private activeModal: NgbActiveModal,
    private service: MainService
  ) {}

  ngOnInit(): void {
    this.getAllPhase();
    this.owner.name = this.memData.currentOwner;
    this.owner.id = this.memData.customer_id;
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
    console.log(tab);
  }

  async uploadLotImage(files: string | any[]) {
    this.loading = true;
    let image: string | ArrayBuffer = await this.service.Image(files);
    if (image) this.memData.lotimage = image;
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
      if (data) {
        this.owner = data;
        this.cusid = data.id;
      }
    });
  }
  save() {
    this.activeModal.close({
      memData: this.memData,
      customer_id: this.cusid,
      ownerisremoved: this.ownerisremoved,
      owner: this.owner,
    });
  }
  cancel() {
    this.activeModal.close({
      memData: null,
      customer_id: 0,
      ownerisremoved: this.ownerisremoved,
    });
  }
  remove(memData) {
    if (memData.deals_id == null) {
      this.owner = { name: undefined, id: 0 };
    } else {
      const warningmodal = this.modalService.open(WarningComponent);
      warningmodal.componentInstance.isConfirmation = true;
      warningmodal.componentInstance.Message = `The owner ${
        memData.currentOwner
      } has already paid ${this.service.numberWithCommas(
        memData.totalpayment
      )}, Are you sure you want to continue.?`;
      warningmodal.result.then((save) => {
        if (save) {
          this.service
            .API(API.DEALS)
            .update(memData.deals_id, { is_deleted: 1 })
            .toPromise()
            .then((res) => {
              this.service.saveLogs(
                LogType.DELETE,
                API.DEALS,
                memData.currentOwner
              );
              this.ownerisremoved = true;
              this.owner = { name: undefined, id: 0 };
              console.log(res);
            });
        }
      });
    }
  }
  async getDealsData(customer_id, mem_id) {
    await this.service
      .API(API.DEALS)
      .searchByQuery(`customer_id=${customer_id}-mem_id=${mem_id}`)
      .toPromise()
      .then((data) => {
        this.dealsData = data;
      });
  }
}
