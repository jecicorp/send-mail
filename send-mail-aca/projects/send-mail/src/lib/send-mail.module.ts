import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EffectsModule } from '@ngrx/effects';
import { TranslateModule } from '@ngx-translate/core';

import { SendMailComponent } from './send-mail.component';
import { SendMailEffects } from './effects/send-mail.effects';
import { SendMailService } from './send-mail.service';
import { SendMailDialogComponent } from './send-mail-dialog.component';

import { TranslationService, PipeModule } from '@alfresco/adf-core';

@NgModule({
  declarations: [SendMailComponent, SendMailDialogComponent],
  imports: [
    EffectsModule.forFeature([SendMailEffects]),
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatChipsModule,
    PipeModule,
    TranslateModule.forRoot()
  ],
  exports: [SendMailComponent],
  providers: [SendMailService],
  entryComponents: [SendMailDialogComponent]
})

export class SendMailModule {
  constructor(translation: TranslationService) {
    translation.addTranslationFolder(
      'send-mail',
      'assets/send-mail'
    );
  }
}
