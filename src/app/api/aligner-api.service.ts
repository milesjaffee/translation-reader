import { inject, Injectable } from '@angular/core';
import { FETCH_API } from '@ngx-templates/shared/fetch';

import { environment } from '../../environments/environment';
import { AlignmentResult, AlignRequest } from '../aligner/alignment.model';

@Injectable({ providedIn: 'root' })
export class AlignerApi {
  private _fetch = inject(FETCH_API);

  /**
   * Align a source text with its translation and annotate each word.
   *
   * @param request Source/translation texts and their language codes
   * @returns Per-word annotations for both sides
   */
  async align(request: AlignRequest): Promise<AlignmentResult> {
    const response = await this._fetch(`${environment.apiBaseUrl}/api/align`, {
      method: 'POST',
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.detail || JSON.stringify(json));
    }

    return json;
  }
}
