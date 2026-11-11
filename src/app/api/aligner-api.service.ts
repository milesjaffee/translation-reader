import { inject, Injectable } from '@angular/core';
import { FETCH_API } from '@ngx-templates/shared/fetch';

import { environment } from '../../environments/environment';
import { AuthService } from '../firebase/auth.service';
import { AlignmentResult, AlignRequest } from '../translation-output/alignment.model';

@Injectable({ providedIn: 'root' })
export class AlignerApi {
  private _fetch = inject(FETCH_API);
  private _auth = inject(AuthService);

  /**
   * Align a source text with its translation and annotate each word.
   *
   * @param request Source/translation texts and their language codes
   * @returns Per-word annotations for both sides
   */
  async align(request: AlignRequest): Promise<AlignmentResult> {
    const token = await this._auth.idToken();
    const response = await this._fetch(`${environment.apiBaseUrl}/api/align`, {
      method: 'POST',
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.detail || JSON.stringify(json));
    }

    return json;
  }
}
