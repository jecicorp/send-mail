import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import { MinimalNodeEntryEntity, SharedLinkEntry } from '@alfresco/js-api';
import { SendMailDialogComponent } from './send-mail-dialog.component';
import { AppStore, getSharedUrl } from '@alfresco/aca-shared/store';
import { SharedLinksApiService } from '@alfresco/adf-core';

@Injectable({
  providedIn: 'root'
})
export class SendMailService {

  constructor(private dialogRef: MatDialog,
    private store: Store<AppStore>,
    private sharedLinksService: SharedLinksApiService) { }

  async sendByMail(node: MinimalNodeEntryEntity) {
    // Get or create the id for the link share
    const sharedId = await this.getShareId(node);

    this.store.select(getSharedUrl).pipe(take(1)).subscribe(baseShareUrl => {
      this.dialogRef.open(SendMailDialogComponent, {
        disableClose: true,
        autoFocus: true,
        data: {
          node,
          baseShareUrl,
          sharedId
        }
      });
    });
  }

  // Récupère l'id (qshare:qshareId) du lien de partage s'il existe
  // Sinon on le crée
  private getShareId(node: MinimalNodeEntryEntity) {
    const properties = node.properties;
    if (!properties || !properties['qshare:sharedId']) {
      return new Promise(
        (resolve, reject) => {
          this.sharedLinksService.createSharedLinks(node.id).subscribe(
            (sharedLinkEntry) => {
              const sharedLink: SharedLinkEntry = sharedLinkEntry;
              resolve(sharedLink.entry.id);
            },
            (error) => {
              reject(error);
            }
          )
        }
      );
    } else {
      return properties['qshare:sharedId'];
    }
  }
}
