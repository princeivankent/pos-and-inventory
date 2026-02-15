export class TrendMetadataDto {
  value: number;
  change_amount: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'neutral';
  previous_value: number;
}
