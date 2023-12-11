import { MainService } from './../../../../main.service';
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CameraComponent } from 'src/app/camera/camera.component';
import { API, IUser } from 'src/app/helper';

@Component({
  selector: 'app-userform',
  templateUrl: './userform.component.html',
  styleUrls: ['./userform.component.scss'],
})
export class UserformComponent implements OnInit {
  @Input() SelectedUser: IUser;
  @Input() status: string = 'view';
  @Input() errormessage: string;
  showcode: boolean = false;
  changepassword = false;
  newuser: boolean = false;
  imagePath: string | any[];
  message: string;
  groupList = [];
  account = {
    password: null as string,
  };
  baseColor = '#FFF';
  barLabel = 'Password strength:';
  strengthLabels = ['Useless', 'Weak', 'Normal', 'Strong', 'Great!'];
  myColors = ['#DD2C00', '#FF6D00', '#FFD600', '#AEEA00', '#00C853'];
  strength = 0;
  ExistingUsername: boolean = false;

  strengthChanged(strength: number) {
    this.strength = strength;
  }
  constructor(
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private service: MainService
  ) {
    this.newuser = this.status == 'new';
  }
  confirm_password = '';
  currentUser = '';
  ngOnInit(): void {
    this.getGroup();
    this.SelectedUser.password = '';
    this.confirm_password = '';
    this.currentUser = localStorage.getItem('currentuser');
  }
  validateNumber() {
    this.SelectedUser.phonenumber = String(
      this.SelectedUser.phonenumber
    ).replace(/[a-zA-Z]+/g, '');
  }
  checkUserName() {
    this.service
      .API(API.USER)
      .searchByQuery(`username <=> '${this.SelectedUser.username}'`)
      .toPromise()
      .then((res) => {
        this.ExistingUsername = (res as []).length != 0;
        console.log(this.ExistingUsername, (res as []).length);
      });
  }
  showCode(show: boolean) {
    this.showcode = show;
  }
  close() {
    this.activeModal.dismiss();
  }
  save() {
    let safeToSave =
      this.SelectedUser.firstName != '' &&
      this.SelectedUser.firstName != undefined &&
      this.SelectedUser.lastName != '' &&
      this.SelectedUser.lastName != undefined &&
      this.SelectedUser.email != '' &&
      this.SelectedUser.email != undefined &&
      this.SelectedUser.phonenumber != '' &&
      this.SelectedUser.phonenumber != undefined &&
      this.SelectedUser.groupId != '' &&
      this.SelectedUser.groupId != undefined &&
      this.SelectedUser.address != '' &&
      this.SelectedUser.address != undefined &&
      this.SelectedUser.username != '' &&
      this.SelectedUser.username != undefined &&
      this.SelectedUser.password == this.confirm_password;
    console.log(safeToSave);
    if (safeToSave) {
      this.SelectedUser.password = btoa(this.SelectedUser.password);
      if (this.status == 'edit' && !this.changepassword) {
        delete this.SelectedUser['password'];
      }
      this.activeModal.close(this.SelectedUser);
    } else {
      alert('Please complete all the required input.');
    }
  }
  openCamera() {
    const modal = this.modalService.open(CameraComponent, {
      size: 'lg',
    });
    modal.result.then((img) => {
      try {
        this.SelectedUser.img = img._imageAsDataUrl;
      } catch (error) {}
    });
  }

  preview(files: string | any[]) {
    if (files.length === 0) return;

    var mimeType = files[0].type;
    if (mimeType.match(/image\/*/) == null) {
      this.message = 'Only images are supported.';
      return;
    }

    var reader = new FileReader();
    this.imagePath = files;
    reader.readAsDataURL(files[0]);
    reader.onload = (_event) => {
      this.SelectedUser.img = reader.result;
    };
  }
  getGroup() {
    this.service
      .API(API.GROUP)
      .getAll()
      .toPromise()
      .then((data) => {
        this.groupList = data;
      });
  }
  CheckGroup() {
    let group = this.groupList.filter(
      (data) => data.id == this.SelectedUser.groupId
    );
    let functions: string = group[0]['functions'];
    this.SelectedUser.have_supervision = functions.includes('77');
  }

  changePassword() {
    if (!this.changepassword) {
      this.SelectedUser.password = '';
      this.confirm_password = '';
    } else {
      this.SelectedUser.password = '';
      this.confirm_password = '';
    }
  }
}
