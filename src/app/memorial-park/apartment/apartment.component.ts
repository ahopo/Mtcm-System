import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AngularCsv } from 'angular7-csv/dist/Angular-csv';
import { CurrencyMaskInputMode } from 'ngx-currency';
import {
  API,
  Confirm,
  IBoneCrypt,
  Icon,
  LogType,
  ModalStatus,
} from 'src/app/helper';
import { MainService } from 'src/app/main.service';
import { ConfirmationComponent } from 'src/app/modal/confirmation/confirmation.component';
import { LookUpReferenceComponent } from 'src/app/modal/look-up-reference/look-up-reference.component';
import { GlobalToastService } from 'src/app/Toast/global-toast.service';
import { BoneCryptInfoComponent } from '../modal/bone-crypt-info/bone-crypt-info.component';

@Component({
  selector: 'app-apartment',
  templateUrl: './apartment.component.html',
  styleUrls: ['./apartment.component.scss'],
})
export class ApartmentComponent implements OnInit {
  locks = {
    MPAA: false,
    MPAE: false,
    MPAD: false,
    MPAV: false,
    MPAAS: false,
    MPAES: false,
    MPADS: false,
  };
  lockLoad = false;
  loading = false;
  phaseList = [];
  apartmentList: IBoneCrypt[] = [];
  origList: IBoneCrypt[] = [];
  boneData: IBoneCrypt;
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
    localStorage.getItem('actions').toLowerCase().includes('mpae') ||
    localStorage.getItem('actions').toLowerCase().includes('mpaes');
  constructor(
    private service: MainService,
    private modalService: NgbModal,
    private toastservice: GlobalToastService
  ) {}

  ngOnInit(): void {
    this.getAllApartment();
    this.getAllPhase();
    this.getLock();
  }
  async getAllApartment() {
    this.loading = true;
    await this.service
      .API(API.APARTMENT)
      .getAll()
      .toPromise()
      .then((res) => {
        this.apartmentList = res;
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
        .API(API.APARTMENT)
        .searchByQuery(query.join('-'))
        .toPromise()
        .then((data) => {
          this.apartmentList = data;
        });
    } else {
      this.getAllApartment();
    }
  }
  async getCurrentOwner() {
    let listofApartmentId = this.origList.map((data) => data.id);
    let table: { id: number; name: string }[] = [];
    await this.service
      .API(API.DEALS)
      .searchByQuery(`apartment_id in (${listofApartmentId.join(',')})`)
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
  goToEditForm(id) {
    sessionStorage.setItem('id', id);
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
          .API(API.APARTMENT)
          .CheckIfExistThenCancel(
            {
              phase: this.phaseList.filter((d) => d.id == data['phase_id'])[0]
                .name,
              col: data['col'],
              volt: data['volt'],
            },
            this.apartmentList.map((d) => {
              return { phase: d.phase, col: d['col'], volt: d['volt'] };
            })
          )
          .create(result.boneData)
          .toPromise()
          .then(async (a) => {
            await this.service
              .API(API.APARTMENT)
              .getById(a.res[0].insertId)
              .toPromise()
              .then((res) => {
                console.log('data', res);
                this.service.saveLogs(
                  LogType.CREATE,
                  API.APARTMENT,
                  `${res[0].phase} Blk ${res[0].col} Lt ${res[0].volt}`
                );
              });
            this.toastservice.showSuccess(a.msg, 3000);
            this.getAllApartment();
          });
      }
    });
  }
  updateVolt(apartmentdata) {
    let localdata = {};
    Object.assign(localdata, apartmentdata);
    const modal = this.modalService.open(BoneCryptInfoComponent, {
      size: 'lg',
    });
    apartmentdata['updated_by'] = localStorage.getItem('email');
    apartmentdata['updated_at'] = this.service.CurrentDate;
    modal.componentInstance.boneData = apartmentdata;
    modal.componentInstance.status = ModalStatus.UPDATE;
    modal.result.then(async (result) => {
      let touchedData = this.service.getTouchedItem(result.boneData, localdata);
      await this.service
        .API(API.APARTMENT)
        .update(apartmentdata.id, touchedData)
        .toPromise()
        .then(async (res) => {
          if (result.customer_id > 0) {
            await this.service
              .API(API.DEALS)
              .create({
                apartment_id: result.boneData.id,
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
                API.APARTMENT,
                `${apartmentdata.phase} Col ${apartmentdata.col} Vlt ${apartmentdata.volt}`,
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
              this.getAllApartment();
            } else {
              this.toastservice.showSuccess(res.msg, 3000);
              this.getAllApartment();
            }
          }
        });
    });
  }
  viewVolt(apartmentdata) {
    console.log(apartmentdata);
    const modal = this.modalService.open(BoneCryptInfoComponent, {
      size: 'lg',
    });
    modal.componentInstance.boneData = apartmentdata;
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
    this.getAllApartment();
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
  }
  delete(apartment) {
    const modal = this.modalService.open(ConfirmationComponent, { size: 'lg' });
    modal.componentInstance.TargetItem = `${apartment.phase} Col ${apartment.col} Vlt ${apartment.volt} `;
    modal.componentInstance.IconType = Icon.DELETE;
    modal.componentInstance.ConfirmationType = Confirm.DELETE;
    modal.result.then(async (res) => {
      if (res) {
        await this.service
          .API(API.APARTMENT)
          .delete(apartment.id)
          .toPromise()
          .then((data) => {
            this.service.saveLogs(
              LogType.DELETE,
              API.APARTMENT,
              `${apartment.phase} Col ${apartment.col} Vlt ${apartment.volt}`
            );
            this.toastservice.showSuccess(data.msg, 3000);
            this.getAllApartment();
          });
      }
    });
  }
  downloadCSV() {
    let csvOptions = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalseparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'APARTMENT LIST',
      useBom: true,
      noDownload: false,
      headers: [
        '#',
        'Phase',
        'Level',
        'Number',
        'Price',
        'Availability',
        'Current Owner',
      ],
    };
    new AngularCsv(
      this.apartmentList.map((data, i) => {
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
      `APARTMENT Report ${this.service.CurrentDate}`,
      csvOptions
    );
  }
}
