import { MainService } from 'src/app/main.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-warning',
  templateUrl: './warning.component.html',
  styleUrls: ['./warning.component.scss'],
})
export class WarningComponent implements OnInit {
  @Input() Message: string;
  @Input() isConfirmation: boolean = false;
  constructor(
    private activemodal: NgbActiveModal,
    private service: MainService,
    private router: Router
  ) {
    this.service.play('warning.wav');
  }

  ngOnInit(): void {}
  close() {
    this.activemodal.dismiss();
  }
  save() {
    this.activemodal.close(true);
  }
}
