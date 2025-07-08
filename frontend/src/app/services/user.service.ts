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
  
  /**
   * Retrieves a list of users with their profiles.
   * @returns Observable with a list of users and their profiles.
   */
  getUsers(): Observable<ApiResponse<UserWithProfile[]>> {
    return this.http.get<ApiResponse<UserWithProfile[]>>(`${this.API_URL}/users/list`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Retrieves a specific user by UUID.
   * @param uuid - The UUID of the user.
   * @returns Observable with the user's profile.
   */
  getUser(uuid: string): Observable<ApiResponse<UserWithProfile>> {
    return this.http.get<ApiResponse<UserWithProfile>>(`${this.API_URL}/users/${uuid}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Deletes a user by email.
   * @param email - The email of the user to delete.
   * @returns Observable with the deletion response.
   */
  deleteUser(email: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/users/delete`, {
      headers: this.getHeaders(),
      body: {email}
    });
  }

  /**
   * Creates a new user with the given email.
   * @param email - The email of the user to create.
   * @returns Observable with the created user's profile.
   */
  createUser(email: string): Observable<ApiResponse<UserWithProfile>> {
    return this.http.post<ApiResponse<UserWithProfile>>(`${this.API_URL}/users/create`, {email}, {
      headers: this.getHeaders()
    });
  }

  /**
   * Updates a user's profile with the given data.
   * @param email - The email of the user to update.
   * @param data - The profile data to update.
   * @returns Observable with the updated user's profile.
   */
  updateUser(email: string, data: UpdateProfileRequest): Observable<ApiResponse<UserWithProfile>> {
    return this.http.put<ApiResponse<UserWithProfile>>(`${this.API_URL}/users/update`, {email, data}, {
      headers: this.getHeaders()
    });
  }
} 