# Weather Forecast Endpoints

**Authentication Required:** None (AllowAnonymous)

## GET /weatherforecast

Lấy dự báo thời tiết (endpoint mẫu từ template).

### Request

**Headers:** None (AllowAnonymous)

### Response

**Success (200 OK):**
```json
[
  {
    "date": "2024-01-16",
    "temperatureC": 25,
    "temperatureF": 76,
    "summary": "Warm"
  },
  {
    "date": "2024-01-17",
    "temperatureC": 18,
    "temperatureF": 64,
    "summary": "Cool"
  },
  {
    "date": "2024-01-18",
    "temperatureC": 32,
    "temperatureF": 89,
    "summary": "Hot"
  },
  {
    "date": "2024-01-19",
    "temperatureC": 12,
    "temperatureF": 53,
    "summary": "Chilly"
  },
  {
    "date": "2024-01-20",
    "temperatureC": 28,
    "temperatureF": 82,
    "summary": "Balmy"
  }
]
```

### Response Schema

| Field | Type | Description |
|-------|------|-------------|
| date | DateOnly | Ngày dự báo |
| temperatureC | int | Nhiệt độ Celsius |
| temperatureF | int | Nhiệt độ Fahrenheit (calculated) |
| summary | string | Mô tả thời tiết |

### Example cURL

```bash
curl -X GET "https://localhost:7000/weatherforecast"
```

## Weather Summary Values

Các giá trị có thể cho `summary`:

- "Freezing"
- "Bracing" 
- "Chilly"
- "Cool"
- "Mild"
- "Warm"
- "Balmy"
- "Hot"
- "Sweltering"
- "Scorching"

## Notes

- **Template Endpoint**: Đây là endpoint mẫu từ ASP.NET Core template
- **No Authentication**: Không cần authentication
- **Mock Data**: Dữ liệu được generate ngẫu nhiên, không phải dữ liệu thật
- **Temperature Range**: Nhiệt độ Celsius từ -20 đến 55
- **Fixed Count**: Luôn trả về 5 ngày dự báo
- **No Parameters**: Không có query parameters
- **Route**: Sử dụng route `/weatherforecast` thay vì `/api/weatherforecast`
- **TODO**: Có thể cần thay thế bằng weather API thật hoặc xóa nếu không cần thiết
