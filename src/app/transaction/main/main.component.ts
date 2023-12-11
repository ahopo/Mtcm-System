import { Component, OnInit } from '@angular/core';
import { NgbModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';
import { MainService } from 'src/app/main.service';
import { ConfirmationComponent } from 'src/app/modal/confirmation/confirmation.component';
import { GlobalToastService } from 'src/app/Toast/global-toast.service';
import { ClientFormComponent } from '../modal/client-form/client-form.component';
import { API, Confirm, Icon, ICustomer, LogType } from 'src/app/helper';
import { AngularCsv } from 'angular7-csv/dist/Angular-csv';
@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  locks = {
    HA: false,
    HE: false,
    HD: false,
    HV: false,
    HAS: false,
    HES: false,
    HDS: false,
  };
  lockLoad = false;
  public Transactions: ICustomer[] = [];
  private _transaction: ICustomer[] = [];
  SearchVal: string;
  page = 1;
  loading = false;
  donefetching = false;
  constructor(
    private service: MainService,
    private modalService: NgbModal,
    config: NgbModalConfig,
    private toastService: GlobalToastService
  ) {
    config.backdrop = 'static';
    config.keyboard = false;
  }

  ngOnInit(): void {
    this.displayTransactions();
    sessionStorage.clear();
    this.getLock();
  }
  async displayTransactions() {
    this.SearchVal = '';
    this.loading = true;
    await this.service
      .API(API.CUSTOMER)
      .getAll()
      .toPromise()
      .then((data) => {
        this.Transactions = data;
        this._transaction = data;
      })
      .catch((err) => console.log(err));

    this.loading = false;
    this.donefetching = true;
  }

  openModal() {
    const modal = this.modalService.open(ClientFormComponent, {
      size: 'lg',
    });
    modal.componentInstance.client = {};
    modal.result.then((client) => {
      client.billingType = '1';
      client.createdAt = this.service.CurrentDate;
      client.createdby = localStorage.getItem('email');
      client.fullyPaid = '1';
      this.service
        .API(API.CUSTOMER)
        .create(client)
        .toPromise()
        .then((result) => {
          client.id = result.res[0].insertId;
          this.Transactions.push(client);
          this.toastService.showSuccess(result.msg, 3000);

          this.service.saveLogs(
            LogType.CREATE,
            API.CUSTOMER,
            `${client.firstName} ${
              client.middleName ? client.middleName : ''
            } ${client.lastName}`
          );
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }

  viewTransaction(client: ICustomer) {
    const modal = this.modalService.open(ClientFormComponent, {
      size: 'lg',
      backdropClass: 'bg-info',
    });
    modal.componentInstance.client = client;
    modal.componentInstance.view = true;
  }
  deleteTransaction(client: ICustomer) {
    console.log(client);
    this.SearchVal = '';

    const confmdal = this.modalService.open(ConfirmationComponent, {
      size: 'lg',
    });

    confmdal.componentInstance.ConfirmationtType = Confirm.DELETE;
    confmdal.componentInstance.TargetItem = ` ${client.firstName} ${client.middleName} ${client.lastName}`;
    confmdal.componentInstance.IconType = Icon.DELETE;
    confmdal.result.then((res) => {
      if (res) {
        this.service
          .API(API.CUSTOMER)
          .delete(client.id)
          .toPromise()
          .then((result) => {
            this.Transactions = this.Transactions.filter(
              (t) => t.id !== client.id
            );
            this.toastService.showWarning(result.msg, 3000);
            this.service.saveLogs(
              LogType.DELETE,
              API.CUSTOMER,
              ` ${client.firstName} ${
                client.middleName ? client.middleName : ''
              } ${client.lastName} `
            );
          })
          .catch((error) => {
            console.log(error);
          });
      }
    });
  }

  search() {
    if (this.SearchVal !== '') {
      this.page = 1;
      this.Transactions = this._transaction.filter((data: ICustomer) =>
        `${data.firstName}${data.middleName}${data.lastName}${data.email}`
          .toLowerCase()
          .includes(this.SearchVal.toLowerCase())
      );
    } else {
      this.displayTransactions();
    }
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
  onContainerScroll(event) {
    let topdiv = <HTMLDivElement>document.getElementById('topdiv');

    if (event.target.scrollTop >= 200) {
      topdiv.style.visibility = 'hidden';
      topdiv.style.height = '0px';
    } else {
      topdiv.style.visibility = 'visible';
      topdiv.style.height = '46px';
    }
    // console.log(event.target.scrollTop, event.target.scrollHeight);
  }

  downloadCSV() {
    let csvOptions = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalseparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'CUSTOMER LIST',
      useBom: true,
      noDownload: false,
      headers: [
        '#',
        'Full Name',
        'Gender',
        'Phone Number',
        'Email',
        'Created By',
        'Created At',
        'Updated At',
        'Updated By',
      ],
    };
    new AngularCsv(
      this.Transactions.map((data, i) => {
        return {
          number: i + 1,
          fullname: `${data.firstName} ${data.middleName} ${data.lastName} ${data.suffixName}`,
          g: data.gender == 1 ? 'Male' : 'Female',
          phnumber: data.phoneNumber,
          emai: data.email,
          cby: data.createdby,
          cat: data.createdAt,
        };
      }),
      `Customer Report ${this.service.CurrentDate}`,
      csvOptions
    );
  }
}
