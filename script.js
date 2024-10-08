using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using OrderBookingService.Models;
using System;
using System.Collections.Generic;

namespace OrderBookingService.Controllers
{
    [Route("orders")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly IMemoryCache _cache;
        private readonly string _userTopic;

        // Simulate a user-based topic name for the service
        public OrdersController(IMemoryCache cache)
        {
            _cache = cache;
            _userTopic = "miclarke"; // Hardcoded for demonstration
        }

        // POST /orders/order - Create a new order
        [HttpPost("order")]
        public IActionResult CreateOrder([FromBody] Purchase purchase)
        {
            if (purchase == null || string.IsNullOrWhiteSpace(purchase.Symbol) || purchase.Quantity <= 0 || purchase.Price <= 0)
                return BadRequest("Invalid purchase data.");

            // Create a new order with unique ID
            var order = new Order
            {
                Id = new Random().Next(1, 10000), // For demonstration; in production, use a more robust ID generator.
                Symbol = purchase.Symbol,
                Quantity = purchase.Quantity,
                BookingTime = DateTime.UtcNow,
                BidPrice = purchase.Price,
                Status = "Booked"
            };

            // Save order to in-memory cache
            List<Order> orders;
            if (!_cache.TryGetValue("OrderList", out orders))
                orders = new List<Order>();

            orders.Add(order);
            _cache.Set("OrderList", orders);

            return Ok(order);
        }

        // GET /orders/all - Get all orders
        [HttpGet("all")]
        public IActionResult GetAllOrders()
        {
            if (!_cache.TryGetValue("OrderList", out List<Order> orders))
                orders = new List<Order>();

            return Ok(orders);
        }

        // GET /orders/whoami - Get the CPS topic name
        [HttpGet("whoami")]
        public IActionResult GetUserTopic()
        {
            return Ok(new { TopicName = _userTopic });
        }

        // POST /orders/update/{id} - Update an order status (mock fulfilment/reject)
        [HttpPost("update/{id}")]
        public IActionResult UpdateOrderStatus(int id, [FromBody] string status)
        {
            if (string.IsNullOrWhiteSpace(status))
                return BadRequest("Invalid status.");

            if (!_cache.TryGetValue("OrderList", out List<Order> orders))
                return NotFound("Order list not found.");

            var order = orders.Find(o => o.Id == id);
            if (order == null)
                return NotFound($"Order with ID {id} not found.");

            // Update order status and execution time if fulfilled
            order.Status = status;
            order.ExecutionTime = DateTime.UtcNow;

            _cache.Set("OrderList", orders);
            return Ok(order);
        }
    }
            }



using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace OrderBookingService
{
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            // Add MVC services to the project
            services.AddControllers();

            // Add in-memory caching
            services.AddMemoryCache();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseRouting();

            app.UseEndpoints(endpoints =>
            {
                // Map controller routes
                endpoints.MapControllers();
            });
        }
    }
}





using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace OrderBookingService
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                });
    }
}




<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net48</TargetFramework>
    <OutputType>Exe</OutputType>
    <RootNamespace>OrderBookingService</RootNamespace>
    <AssemblyName>OrderBookingService</AssemblyName>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.App" />
  </ItemGroup>

</Project>



