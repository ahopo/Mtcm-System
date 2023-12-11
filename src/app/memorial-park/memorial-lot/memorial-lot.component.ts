import { GlobalToastService } from 'src/app/Toast/global-toast.service';
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CurrencyMaskInputMode } from 'ngx-currency';
import {
  API,
  Confirm,
  Icon,
  IMemorialLot,
  IMemorialLotView,
  LogType,
  ModalStatus,
} from 'src/app/helper';
import { MainService } from 'src/app/main.service';
import { ConfirmationComponent } from 'src/app/modal/confirmation/confirmation.component';
import { LookUpReferenceComponent } from 'src/app/modal/look-up-reference/look-up-reference.component';
import { MemoriallotInfoComponent } from '../modal/memoriallot-info/memoriallot-info.component';
import { ESRCH } from 'node:constants';
import { AngularCsv } from 'angular7-csv/dist/Angular-csv';

@Component({
  selector: 'app-memorial-lot',
  templateUrl: './memorial-lot.component.html',
  styleUrls: ['./memorial-lot.component.scss'],
})
export class MemorialLotComponent implements OnInit {
  locks = {
    MPMLA: false,
    MPMLE: false,
    MPMLD: false,
    MPMLV: false,
    MPMLAS: false,
    MPMLES: false,
    MPMLDS: false,
  };
  hascustomer =
    localStorage.getItem('actions').toLowerCase().includes('he') ||
    localStorage.getItem('actions').toLowerCase().includes('hes');
  lockLoad = false;
  loading = false;
  memData: IMemorialLot;
  memList: IMemorialLotView[] = [];
  origList: IMemorialLotView[] = [];
  phaseList = [];
  page = 1;
  currentOwner = '';
  filter = {
    phase_id: 0,
    block: '',
    lot: '',
    area: '',
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

  //Constructor
  constructor(
    private service: MainService,
    private modalService: NgbModal,
    private toastservice: GlobalToastService
  ) {}

  ngOnInit(): void {
    this.getAllPhase();
    this.getAllMemorialLot();
    this.getLock();
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
  async getAllMemorialLot() {
    this.loading = true;
    await this.service
      .API(API.MEMORIALLOT)
      .getAll()
      .toPromise()
      .then((res) => {
        this.memList = res;
        Object.assign(this.origList, res);
      });
    this.loading = false;
  }
  //actions
  newLot() {
    const modal = this.modalService.open(MemoriallotInfoComponent, {
      size: 'lg',
    });

    modal.componentInstance.memData = {};
    modal.componentInstance.status = ModalStatus.NEW;
    modal.result.then((result) => {
      let data: IMemorialLotView = result.memData;
      if (data != null) {
        this.service
          .API(API.MEMORIALLOT)
          .CheckIfExistThenCancel(
            {
              phase: this.phaseList.filter((d) => d.id == data['phase_id'])[0]
                .name,
              block: data.block,
              lot: data.lot,
            },
            this.memList.map((d) => {
              return { phase: d.phase, block: d.block, lot: d.lot };
            })
          )
          .create(data)
          .toPromise()
          .then(async (a) => {
            await this.service
              .getById(a.res[0].insertId)
              .toPromise()
              .then((res) => {
                this.service.saveLogs(
                  LogType.CREATE,
                  API.MEMORIALLOT,
                  `${res[0].phase} Blk ${res[0].block} Lt ${res[0].lot}`
                );
              });

            this.toastservice.showSuccess(a.msg, 3000);
            this.getAllMemorialLot();
          });
      }
    });
  }
  viewLot(memdata) {
    const modal = this.modalService.open(MemoriallotInfoComponent, {
      size: 'lg',
    });
    modal.componentInstance.memData = memdata;
    modal.componentInstance.status = ModalStatus.VIEW;
  }
  async updateLot(memdata) {
    let localdata = {};
    Object.assign(localdata, memdata);
    const modal = this.modalService.open(MemoriallotInfoComponent, {
      size: 'lg',
    });
    memdata['updated_by'] = localStorage.getItem('email');
    memdata['updated_at'] = this.service.CurrentDate;
    modal.componentInstance.memData = memdata;
    modal.componentInstance.status = ModalStatus.UPDATE;
    await modal.result.then(async (result) => {
      let touchedData = this.service.getTouchedItem(result.memData, localdata);
      let hasCustomer = result.customer_id > 0;
      await this.service
        .API(API.MEMORIALLOT)
        .update(memdata.id, touchedData)
        .toPromise()
        .then(async (res) => {
          //update success
          if (hasCustomer) {
            // inserting data to deals
            await this.service
              .API(API.DEALS)
              .create({
                mem_id: result.memData.id,
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
                //insert success
              });
          }
          ///saving logs

          for (let d in touchedData) {
            if (d != 'updated_by' && d != 'updated_at') {
              this.service.saveLogs(
                LogType.UPDATE,
                API.MEMORIALLOT,
                `${result.memData.phase} Blk ${result.memData.block} Lt ${result.memData.lot}`,
                localdata[d],
                touchedData[d],
                d
              );
            }
          }

          if (result.ownerisremoved && !res.msg.includes('No')) {
            res.msg += ' and Owner has been removed!';
            this.toastservice.showSuccess(res.msg, 3000);
            this.getAllMemorialLot();
          } else {
            this.toastservice.showWarning(res.msg, 3000);
            this.getAllMemorialLot();
          }
        });
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
        .API(API.MEMORIALLOT)
        .searchByQuery(query.join('-'))
        .toPromise()
        .then((data) => {
          this.memList = data;
        });
    } else {
      this.getAllMemorialLot();
    }
  }
  clearSearch() {
    this.filter = {
      phase_id: 0,
      block: '',
      lot: '',
      area: '',
      is_available: 0,
      price: 0,
      customer_id: 0,
    };
    this.currentOwner = '';
    this.getAllMemorialLot();
  }
  async getCurrentOwner() {
    let listofMemID = this.origList.map((data) => data.id);
    let table: { id: number; name: string }[] = [];
    await this.service
      .API(API.DEALS)
      .searchByQuery(`mem_id in (${listofMemID.join(',')})`)
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
      this.search();
    });
  }
  downloadCSV() {
    let csvOptions = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalseparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'MEMORIAL LOT LIST',
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
      this.memList.map((data, i) => {
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
      `MEMORIAL LOT Report ${this.service.CurrentDate}`,
      csvOptions
    );
  }
  delete(mem) {
    const modal = this.modalService.open(ConfirmationComponent, { size: 'lg' });
    modal.componentInstance.TargetItem = `${mem.phase} BLK ${mem.block} LT ${mem.lot}`;
    modal.componentInstance.IconType = Icon.DELETE;
    modal.componentInstance.ConfirmationType = Confirm.DELETE;
    modal.result.then(async (res) => {
      if (res) {
        await this.service
          .API(API.MEMORIALLOT)
          .delete(mem.id)
          .toPromise()
          .then((data) => {
            this.service.saveLogs(
              LogType.DELETE,
              API.MEMORIALLOT,
              `${mem.phase} Blk ${mem.block} Lt ${mem.lot}`
            );
            this.toastservice.showSuccess(data.msg, 3000);
            this.getAllMemorialLot();
          });
      }
    });
  }
  goToEditForm(id) {
    sessionStorage.setItem('id', id);
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
