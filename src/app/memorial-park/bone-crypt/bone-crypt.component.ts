import { GlobalToastService } from './../../Toast/global-toast.service';
import { MainService } from './../../main.service';
import { Component, OnInit } from '@angular/core';
import { CurrencyMaskInputMode } from 'ngx-currency';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  API,
  Confirm,
  IBoneCrypt,
  Icon,
  LogType,
  ModalStatus,
} from 'src/app/helper';
import { LookUpReferenceComponent } from 'src/app/modal/look-up-reference/look-up-reference.component';
import { BoneCryptInfoComponent } from '../modal/bone-crypt-info/bone-crypt-info.component';
import { TelephoneInbound } from 'ng-bootstrap-icons/icons';
import { ConfirmationComponent } from 'src/app/modal/confirmation/confirmation.component';
import { AngularCsv } from 'angular7-csv/dist/Angular-csv';

@Component({
  selector: 'app-bone-crypt',
  templateUrl: './bone-crypt.component.html',
  styleUrls: ['./bone-crypt.component.scss'],
})
export class BoneCryptComponent implements OnInit {
  locks = {
    MPBCA: false,
    MPBCE: false,
    MPBCD: false,
    MPBCV: false,
    MPBCAS: false,
    MPBCES: false,
    MPBCDS: false,
  };
  lockLoad = false;
  loading = false;
  phaseList = [];
  bonecryptList: IBoneCrypt[] = [];
  origList: IBoneCrypt[] = [];
  bonecryptData: IBoneCrypt;
  filter = {
    phase_id: 0,
    volt: 0,
    col: 0,
    area: 0,
    is_available: 0,
    price: 0,
    customer_id: 0,
  };
  currentOwner;
  options = {
    default: 0.0,
    prefix: '₱',
    thousands: ',',
    decimal: '.',
    inputMode: CurrencyMaskInputMode.FINANCIAL,
  };
  page = 1;
  hascustomer =
    localStorage.getItem('actions').toLowerCase().includes('mpbce') ||
    localStorage.getItem('actions').toLowerCase().includes('mpbces');
  constructor(
    private service: MainService,
    private modalService: NgbModal,
    private toastservice: GlobalToastService
  ) {}

  ngOnInit(): void {
    this.getAllBoneCrypt();
    this.getAllPhase();
    this.getLock();
  }
  async getAllBoneCrypt() {
    this.loading = true;
    await this.service
      .API(API.BONECRYPT)
      .getAll()
      .toPromise()
      .then((res) => {
        this.bonecryptList = res;
        this.loading = false;
        Object.assign(this.origList, res);
      });
  }
  search() {
    let query = [];
    for (const item in this.filter) {
      if (this.filter[item] > 0) {
        query.push(`${item}=${this.filter[item]}`);
      }
    }
    if (query.length > 0) {
      this.service
        .API(API.BONECRYPT)
        .searchByQuery(query.join('-'))
        .toPromise()
        .then((data) => {
          this.bonecryptList = data;
        });
    } else {
      this.getAllBoneCrypt();
    }
  }
  async getCurrentOwner() {
    let listofBoneId = this.origList.map((data) => data.id);
    let table: { id: number; name: string }[] = [];
    await this.service
      .API(API.DEALS)
      .searchByQuery(`bone_id in (${listofBoneId.join(',')})`)
      .toPromise()
      .then((data) => {
        data.forEach((d) => {
          if (!table.some((deal) => deal.id == d.customerId)) {
            table.push({
              id: d.customerId,
              name: `${d.firstName} ${d.middleName} ${d.lastName}`,
            });
          }
        });
      });

    const modal = this.modalService.open(LookUpReferenceComponent, {
      size: 'md',
    });
    modal.componentInstance.table = table;
    modal.componentInstance.tableName = 'Full Name';
    modal.componentInstance.title = 'List of Customer';
    modal.result.then(async (res) => {
      this.filter.customer_id = res.id;
      this.currentOwner = await res['name'];
      console.log(res);
      this.search();
    });
    console.log(table);
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
  downloadCSV() {
    let csvOptions = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalseparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'BONECRYPT LIST',
      useBom: true,
      noDownload: false,
      headers: [
        '#',
        'Phase',
        'Column',
        'Vualt',
        'Price',
        'Availability',
        'Current Owner',
      ],
    };
    new AngularCsv(
      this.bonecryptList.map((data, i) => {
        return {
          number: i + 1,
          p: data.phase,
          b: data['col'],
          l: data['volt'],
          pr: data.price,
          av: data.is_available == 1 ? 'NO' : 'YES',
          c: data.currentOwner,
        };
      }),
      `BONECRYPT Report ${this.service.CurrentDate}`,
      csvOptions
    );
  }
  newVolt() {
    const modal = this.modalService.open(BoneCryptInfoComponent, {
      size: 'lg',
    });
    modal.componentInstance.boneData = {};
    modal.componentInstance.status = ModalStatus.NEW;
    modal.result.then((result) => {
      let data: IBoneCrypt = result.memData;
      if (result.boneData != null) {
        this.service
          .API(API.BONECRYPT)
          .CheckIfExistThenCancel(
            {
              phase: this.phaseList.filter((d) => d.id == data['phase_id'])[0]
                .name,
              col: data['col'],
              volt: data['volt'],
            },
            this.bonecryptList.map((d) => {
              return { phase: d.phase, col: d['col'], volt: d['volt'] };
            })
          )
          .create(data)
          .toPromise()
          .then(async (a) => {
            await this.service
              .API(API.BONECRYPT)
              .getById(a.res[0].insertId)
              .toPromise()
              .then((res) => {
                console.log('data', res);
                this.service.saveLogs(
                  LogType.CREATE,
                  API.BONECRYPT,
                  `${res[0].phase} Blk ${res[0].col} Lt ${res[0].volt}`
                );
              })
              .catch((err) => {
                console.log(err);
              });
            this.toastservice.showSuccess(a.msg, 3000);
            this.getAllBoneCrypt();
          });
      }
    });
  }
  goToEditForm(id) {
    sessionStorage.setItem('id', id);
  }
  updateVolt(bonedata) {
    let localdata = {};
    Object.assign(localdata, bonedata);
    const modal = this.modalService.open(BoneCryptInfoComponent, {
      size: 'lg',
    });
    bonedata['updated_by'] = localStorage.getItem('email');
    bonedata['updated_at'] = this.service.CurrentDate;
    modal.componentInstance.boneData = bonedata;
    modal.componentInstance.status = ModalStatus.UPDATE;
    modal.result.then(async (result) => {
      let touchedData = this.service.getTouchedItem(result.boneData, localdata);
      let hasCustomer = result.customer_id > 0;
      await this.service
        .API(API.BONECRYPT)
        .update(bonedata.id, touchedData)
        .toPromise()
        .then(async (res) => {
          if (hasCustomer) {
            await this.service
              .API(API.DEALS)
              .create({
                bone_id: result.boneData.id,
                customer_id: result.customer_id,
                process_by: localStorage.getItem('email'),
              })
              .toPromise()
              .then((data) => {
                this.service.saveLogs(
                  LogType.CREATE,
                  API.DEALS,
                  `${result.owner.name}`
                );
              });
          }
          for (let d in touchedData) {
            if (d != 'updated_by' && d != 'updated_at') {
              this.service.saveLogs(
                LogType.UPDATE,
                API.BONECRYPT,
                `${bonedata.phase} Col ${bonedata.col} Vlt ${bonedata.volt}`,
                localdata[d],
                touchedData[d],
                d
              );
            }
          }
          if (!res.msg.includes('No')) {
            if (result.ownerisremoved) {
              res.msg += ' and Owner has been removed!';
              this.toastservice.showSuccess(res.msg, 3000);
              this.getAllBoneCrypt();
            } else {
              this.toastservice.showSuccess(res.msg, 3000);
              this.getAllBoneCrypt();
            }
          }
        });
    });
  }
  viewVolt(bonedata) {
    console.log(bonedata);
    const modal = this.modalService.open(BoneCryptInfoComponent, {
      size: 'lg',
    });
    modal.componentInstance.boneData = bonedata;
    modal.componentInstance.status = ModalStatus.VIEW;
  }

  clearSearch() {
    this.filter = {
      phase_id: 0,
      volt: 0,
      col: 0,
      area: 0,
      is_available: 0,
      price: 0,
      customer_id: 0,
    };
    this.currentOwner = '';
    this.getAllBoneCrypt();
  }
  async getLock() {
    let actions = '';
    if (localStorage.getItem('actions') == undefined) {
      this.lockLoad = true;

      await new Promise(() => {
        setTimeout(() => {
          actions = localStorage.getItem('actions');
          for (let l in this.locks) {
            this.locks[l] = actions.split(',').some((i) => i == l);
          }
          this.lockLoad = false;
        }, 3000);
      });
    } else {
      actions = localStorage.getItem('actions');
      for (let l in this.locks) {
        this.locks[l] = actions.split(',').some((i) => i == l);
      }
    }
    console.log(actions);
  }

  delete(bone) {
    const modal = this.modalService.open(ConfirmationComponent, { size: 'lg' });
    modal.componentInstance.TargetItem = `${bone.phase} Col ${bone.col} Vlt ${bone.volt} `;
    modal.componentInstance.IconType = Icon.DELETE;
    modal.componentInstance.ConfirmationType = Confirm.DELETE;
    modal.result.then(async (res) => {
      if (res) {
        await this.service
          .API(API.BONECRYPT)
          .delete(bone.id)
          .toPromise()
          .then((data) => {
            this.service.saveLogs(
              LogType.DELETE,
              API.BONECRYPT,
              `${bone.phase} Col ${bone.col} Vlt ${bone.volt}`
            );
            this.toastservice.showSuccess(data.msg, 3000);
            this.getAllBoneCrypt();
          });
      }
    });
  }
}
