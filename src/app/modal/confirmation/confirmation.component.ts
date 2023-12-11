import { Input } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FileBreakFill } from 'ng-bootstrap-icons/icons';
import { Confirm, Icon } from 'src/app/helper';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.scss'],
})
export class ConfirmationComponent implements OnInit {
  @Input() ConfirmationType: string = '';
  @Input() TargetItem: string = '';
  @Input() IconType: string;
  @Input() physicaldelete: boolean = false;
  constructor(private activemodal: NgbActiveModal) {}

  ngOnInit(): void {}
  No() {
    this.activemodal.close(false);
  }
  Yes() {
    this.activemodal.close(true);
  }
}
