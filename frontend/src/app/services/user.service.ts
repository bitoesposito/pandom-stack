import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-base.models';
import { 
  User, 
  UserWithProfile, 
  UpdateProfileRequest,
  GetProfileResponse,
  UpdateProfileResponse
} from '../models/user.models';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})

export class UserService {
  private readonly API_URL = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
  

  // private ensureHttps(url: string | undefined): string | undefined {
  //   if (!url) return url;
  //   if (url.startsWith('http://')) {
  //     return url.replace('http://', 'https://');
  //   }
  //   return url;
  // }

  getUsers(): Observable<ApiResponse<UserWithProfile[]>> {
    return this.http.get<ApiResponse<UserWithProfile[]>>(`${this.API_URL}/users/list`, {
      headers: this.getHeaders()
    });
  }

  getUser(uuid: string): Observable<ApiResponse<UserWithProfile>> {
    return this.http.get<ApiResponse<UserWithProfile>>(`${this.API_URL}/users/${uuid}`, {
      headers: this.getHeaders()
    });
  }

  deleteUser(email: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/users/delete`, {
      headers: this.getHeaders(),
      body: {email}
    });
  }

  createUser(email: string): Observable<ApiResponse<UserWithProfile>> {
    return this.http.post<ApiResponse<UserWithProfile>>(`${this.API_URL}/users/create`, {email}, {
      headers: this.getHeaders()
    });
  }

  updateUser(email: string, data: UpdateProfileRequest): Observable<ApiResponse<UserWithProfile>> {
    return this.http.put<ApiResponse<UserWithProfile>>(`${this.API_URL}/users/update`, {email, data}, {
      headers: this.getHeaders()
    });
  }
} 