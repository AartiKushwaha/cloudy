function showContent(id) {
    const contentDivs = document.querySelectorAll('.about');
    contentDivs.forEach(div => {
      div.style.display = 'none';
    });
  
    document.getElementById(id).style.display = 'block';
  }



dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.Extensions.Configuration

// Models/Order.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace OrderBookingService.Models
{
    public class Order
    {
        [Key]
        public int Id { get; set; }
        public string Symbol { get; set; }
        public int Quantity { get; set; }
        public DateTime BookingTime { get; set; }
        public DateTime ExecutionTime { get; set; }
        public double FillPrice { get; set; }
        public double BidPrice { get; set; }
        public string Status { get; set; }
    }
}

// Models/Purchase.cs
namespace OrderBookingService.Models
{
    public class Purchase
    {
        public string Symbol { get; set; }
        public int Quantity { get; set; }
        public double Price { get; set; }
    }
}


// Data/OrderDbContext.cs
using Microsoft.EntityFrameworkCore;
using OrderBookingService.Models;

namespace OrderBookingService.Data
{
    public class OrderDbContext : DbContext
    {
        public OrderDbContext(DbContextOptions<OrderDbContext> options) : base(options) { }

        public DbSet<Order> Orders { get; set; }
    }
}



{
  "ConnectionStrings": {
    "PostgresConnection": "Host=localhost;Database=OrderBookingDB;Username=your_username;Password=your_password"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}

using Microsoft.EntityFrameworkCore;
using OrderBookingService.Data;
using OrderBookingService.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure PostgreSQL
builder.Services.AddDbContext<OrderDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("PostgresConnection")));

// Register the Order service
builder.Services.AddScoped<OrderService>();

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();


// Services/OrderService.cs
using Microsoft.EntityFrameworkCore;
using OrderBookingService.Data;
using OrderBookingService.Models;

namespace OrderBookingService.Services
{
    public class OrderService
    {
        private readonly OrderDbContext _context;

        public OrderService(OrderDbContext context)
        {
            _context = context;
        }

        public async Task<List<Order>> GetAsync() => await _context.Orders.ToListAsync();

        public async Task<Order?> GetAsync(int id) => await _context.Orders.FindAsync(id);

        public async Task CreateAsync(Order newOrder)
        {
            _context.Orders.Add(newOrder);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(int id, Order updatedOrder)
        {
            var existingOrder = await _context.Orders.FindAsync(id);
            if (existingOrder == null) return;

            existingOrder.Symbol = updatedOrder.Symbol;
            existingOrder.Quantity = updatedOrder.Quantity;
            existingOrder.BookingTime = updatedOrder.BookingTime;
            existingOrder.ExecutionTime = updatedOrder.ExecutionTime;
            existingOrder.FillPrice = updatedOrder.FillPrice;
            existingOrder.BidPrice = updatedOrder.BidPrice;
            existingOrder.Status = updatedOrder.Status;

            await _context.SaveChangesAsync();
        }

        public async Task RemoveAsync(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order != null)
            {
                _context.Orders.Remove(order);
                await _context.SaveChangesAsync();
            }
        }
    }
                                      }



// Controllers/OrderController.cs
using Microsoft.AspNetCore.Mvc;
using OrderBookingService.Models;
using OrderBookingService.Services;

namespace OrderBookingService.Controllers
{
    [ApiController]
    [Route("orders")]
    public class OrderController : ControllerBase
    {
        private readonly OrderService _orderService;

        public OrderController(OrderService orderService) =>
            _orderService = orderService;

        [HttpPost("order")]
        public async Task<IActionResult> Create(Order newOrder)
        {
            await _orderService.CreateAsync(newOrder);
            return CreatedAtAction(nameof(Get), new { id = newOrder.Id }, newOrder);
        }

        [HttpGet("all")]
        public async Task<List<Order>> Get() =>
            await _orderService.GetAsync();

        [HttpGet("whoami")]
        public IActionResult WhoAmI()
        {
            var user = Environment.UserName;
            return Ok($"cps-topic-{user}");
        }
    }
}








