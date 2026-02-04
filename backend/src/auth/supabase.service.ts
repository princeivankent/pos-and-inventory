import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient, createSupabaseAdminClient } from '../config/supabase.config';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;
  private adminClient: SupabaseClient;

  constructor() {
    this.client = createSupabaseClient();
    this.adminClient = createSupabaseAdminClient();
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  getAdminClient(): SupabaseClient {
    return this.adminClient;
  }

  async verifyToken(token: string) {
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return user;
  }
}
