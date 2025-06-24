export interface ApiResponse<T> {
  http_status_code: number;
  success: boolean;
  message: string;
  data: T;
}

export class ApiResponseDto<T> {
  http_status_code: number;
  success: boolean;
  message: string;
  data: T;

  static success<T>(data: T, message: string = 'Success'): ApiResponseDto<T> {
    return {
      http_status_code: 200,
      success: true,
      message,
      data,
    };
  }

  static error<T>(message: string, http_status_code: number = 200): ApiResponseDto<T> {
    return {
      http_status_code,
      success: false,
      message,
      data: null as T,
    };
  }
}

export const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^[0-9]{10}$/,  // 10 digits
  AREA_CODE: /^\+[0-9]{1,4}$/,  // + followed by 1-4 digits
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,  // lowercase letters, numbers, and hyphens
  WEBSITE: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
};

export const VALIDATION_MESSAGES = {
  EMAIL: 'Invalid email format',
  PHONE: 'Phone number must be 10 digits',
  AREA_CODE: 'Area code must start with + followed by 1-4 digits',
  SLUG: 'Slug can only contain lowercase letters, numbers, and hyphens',
  WEBSITE: 'Invalid website URL format',
  REQUIRED_FIELDS: 'All required fields must be provided for first configuration'
}; 