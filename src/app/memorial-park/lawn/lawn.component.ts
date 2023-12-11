import { LogType } from './../../helper';
import { GlobalToastService } from './../../Toast/global-toast.service';
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CurrencyMaskInputMode } from 'ngx-currency';
import {
  API,
  ModalStatus,
  Icon,
  Confirm,
  Ilawn,
  IlawnView,
} from 'src/app/helper';
import { MainService } from 'src/app/main.service';
import { ConfirmationComponent } from 'src/app/modal/confirmation/confirmation.component';
import { LookUpReferenceComponent } from 'src/app/modal/look-up-reference/look-up-reference.component';
import { MemoriallotInfoComponent } from '../modal/memoriallot-info/memoriallot-info.component';
import { AngularCsv } from 'angular7-csv/dist/Angular-csv';

@Component({
  selector: 'app-lawn',
  templateUrl: './lawn.component.html',
  styleUrls: ['./lawn.component.scss'],
})
export class LawnComponent implements OnInit {
  locks = {
    MPLA: false,
    MPLV: false,
    MPLE: false,
    MPLD: false,
    MPLAS: false,
    MPLES: false,
    MPLDS: false,
  };
  lockLoad = false;
  loading = false;
  lawnData: Ilawn;
  lawnList: IlawnView[] = [];
  phaseList = [];
  page = 1;
  currentOwner = '';
  filter = {
    phase_id: 0,
    block: 0,
    lot: 0,
    area: 0,
    is_available: 0,
    price: 0,
    customer_id: 0,
  };
  options = {
    default: 0.0,
    prefix: '₱',
    thousands: ',',
    decimal: '.',
    inputMode: CurrencyMaskInputMode.FINANCIAL,
  };
  hascustomer =
    localStorage.getItem('actions').toLowerCase().includes('mple') ||
    localStorage.getItem('actions').toLowerCase().includes('mples');
  origList: IlawnView[] = [];
  constructor(
    private service: MainService,
    private modalService: NgbModal,
    private toastservice: GlobalToastService
  ) {}

  ngOnInit(): void {
    this.getLock();
    this.getAllPhase();
    this.getAlllawn();
  }
  /// Retrieve section
  async getAllPhase() {
    this.service
      .API(API.PHASE)
      .getAll()
      .toPromise()
      .then((res) => {
        this.phaseList = res;
      });
  }
  async getAlllawn() {
    this.loading = true;
    await this.service
      .API(API.LAWN)
      .getAll()
      .toPromise()
      .then((res) => {
        this.lawnList = res;
        Object.assign(this.origList, res);
      });
    this.loading = false;
  }

  //actions
  newLawn() {
    const modal = this.modalService.open(MemoriallotInfoComponent, {
      size: 'lg',
    });
    modal.componentInstance.memData = {};
    modal.componentInstance.status = ModalStatus.NEW;

    modal.result.then((result) => {
      let data: Ilawn = result.memData;
      if (result.memData != null) {
        this.service
          .API(API.LAWN)
          .CheckIfExistThenCancel(
            {
              phase: this.phaseList.filter((d) => d.id == data['phase_id'])[0]
                .name,
              block: data.block,
              lot: data.lot,
            },
            this.lawnList.map((d) => {
              return { phase: d.phase, block: d.block, lot: d.lot };
            })
          )
          .create(data)
          .toPromise()
          .then(async (a) => {
            await this.service
              .API(API.LAWN)
              .getById(a.res[0].insertId)
              .toPromise()
              .then((res) => {
                this.service.saveLogs(
                  LogType.CREATE,
                  API.LAWN,
                  `${res[0].phase} Blk ${res[0].block} Lt ${res[0].lot}`
                );
              });
            this.getAlllawn();
            this.toastservice.showSuccess(a.msg, 3000);
          });
      }
    });
  }
  viewLot(lawndata) {
    const modal = this.modalService.open(MemoriallotInfoComponent, {
      size: 'lg',
    });
    modal.componentInstance.memData = lawndata;
    modal.componentInstance.status = ModalStatus.VIEW;
  }
  updateLot(lawndata) {
    console.log(lawndata);
    let localdata = {};
    Object.assign(localdata, lawndata);
    const modal = this.modalService.open(MemoriallotInfoComponent, {
      size: 'lg',
    });
    lawndata['updated_by'] = localStorage.getItem('email');
    lawndata['updated_at'] = this.service.CurrentDate;
    modal.componentInstance.memData = lawndata;
    modal.componentInstance.status = ModalStatus.UPDATE;
    modal.result.then(async (result) => {
      let hasCustomer = result.customer_id > 0;
      let touceData = this.service.getTouchedItem(result.memData, localdata);
      await this.service
        .API(API.LAWN)
        .update(lawndata.id, touceData)
        .toPromise()
        .then(async (res) => {
          if (hasCustomer) {
            await this.service
              .API(API.DEALS)
              .create({
                lawn_id: result.memData.id,
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
          if (!res.msg.includes('no')) {
            for (let d in touceData) {
              if (d == 'updated_at' || d == 'updated_by') {
                continue;
              }
              this.service.saveLogs(
                LogType.UPDATE,
                API.LAWN,
                `${lawndata.phase}, BLK ${lawndata.block}, LT ${lawndata.lot}`,
                localdata[d],
                touceData[d],
                d
              );
            }
          }
          if (result.ownerisremoved) {
            res.msg += ' and Owner has been removed!';
            this.toastservice.showSuccess(res.msg, 3000);
            this.getAlllawn();
          } else {
            this.toastservice.showSuccess(res.msg, 3000);
            this.getAlllawn();
          }
          this.getAlllawn();
        });
    });
  }
  goToEditForm(id) {
    sessionStorage.setItem('id', id);
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
        .API(API.LAWN)
        .searchByQuery(query.join('-'))
        .toPromise()
        .then((data) => {
          this.lawnList = data;
        });
    } else {
      this.getAlllawn();
    }
  }
  clearSearch() {
    this.filter = {
      phase_id: 0,
      block: 0,
      lot: 0,
      area: 0,
      is_available: 0,
      price: 0,
      customer_id: 0,
    };
    this.currentOwner = '';
    this.getAlllawn();
  }
  async getCurrentOwner() {
    let listofLawId = this.origList.map((data) => data.id);
    let table: { id: number; name: string }[] = [];
    await this.service
      .API(API.DEALS)
      .searchByQuery(`lawn_id in (${listofLawId.join(',')})`)
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

  downloadCSV() {
    let csvOptions = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalseparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'LAWN LIST',
      useBom: true,
      noDownload: false,
      headers: [
        '#',
        'Phase',
        'Block',
        'Lot',
        'Area',
        'Price',
        'Availability',
        'Current Owner',
      ],
    };
    new AngularCsv(
      this.lawnList.map((data, i) => {
        return {
          number: i + 1,
          p: data.phase,
          b: data.block,
          l: data.lot,
          a: `${data.area} sqm.`,
          pr: data.price,
          av: data.is_available == 1 ? 'NO' : 'YES',
          c: data.currentOwner,
        };
      }),
      `LAWN Report ${this.service.CurrentDate}`,
      csvOptions
    );
  }
  delete(lawn) {
    const modal = this.modalService.open(ConfirmationComponent, { size: 'lg' });
    modal.componentInstance.TargetItem = `${lawn.phase} BLK ${lawn.block} LT ${lawn.lot}`;
    modal.componentInstance.IconType = Icon.DELETE;
    modal.componentInstance.ConfirmationType = Confirm.DELETE;
    modal.result.then(async (yes) => {
      if (yes) {
        await this.service
          .API(API.LAWN)
          .delete(lawn.id)
          .toPromise()
          .then((data) => {
            this.toastservice.showSuccess(data.msg, 3000);
            this.getAlllawn();
            this.service.saveLogs(
              LogType.DELETE,
              API.LAWN,
              `${lawn.phase}, BLK ${lawn.block}, LT ${lawn.lot}`
            );
          });
      }
    });
  }
  async getLock() {
    let actions = '';
    if (localStorage.getItem('actions') == undefined) {
      this.lockLoad = true;

      await new Promise((resolve) => {
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
}
