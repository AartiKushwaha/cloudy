using System;

namespace OrderBookingConsoleApp.Models
{
    public class Order
    {
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

namespace OrderBookingConsoleApp.Models
{
    public class Purchase
    {
        public string Symbol { get; set; }
        public int Quantity { get; set; }
        public double Price { get; set; }
    }
}



using Npgsql;
using System.Data;

namespace OrderBookingConsoleApp
{
    public static class DatabaseConfig
    {
        private static readonly string connectionString = 
            "Host=localhost;Port=5432;Username=your_username;Password=your_password;Database=OrderBookingDB";

        public static IDbConnection GetConnection()
        {
            return new NpgsqlConnection(connectionString);
        }
    }
}





using Dapper;
using OrderBookingConsoleApp.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace OrderBookingConsoleApp.Services
{
    public class OrderService
    {
        private readonly IDbConnection _dbConnection;

        public OrderService()
        {
            _dbConnection = DatabaseConfig.GetConnection();
        }

        public async Task<int> CreateOrderAsync(Order order)
        {
            string sql = @"
                INSERT INTO Orders (Symbol, Quantity, BookingTime, ExecutionTime, FillPrice, BidPrice, Status)
                VALUES (@Symbol, @Quantity, @BookingTime, @ExecutionTime, @FillPrice, @BidPrice, @Status)
                RETURNING Id;";

            return await _dbConnection.ExecuteScalarAsync<int>(sql, order);
        }

        public async Task<List<Order>> GetAllOrdersAsync()
        {
            string sql = "SELECT * FROM Orders";
            var result = await _dbConnection.QueryAsync<Order>(sql);
            return result.AsList();
        }

        public async Task<Order> GetOrderByIdAsync(int id)
        {
            string sql = "SELECT * FROM Orders WHERE Id = @Id";
            return await _dbConnection.QueryFirstOrDefaultAsync<Order>(sql, new { Id = id });
        }

        public async Task UpdateOrderStatusAsync(int id, string status)
        {
            string sql = "UPDATE Orders SET Status = @Status WHERE Id = @Id";
            await _dbConnection.ExecuteAsync(sql, new { Id = id, Status = status });
        }

        public async Task DeleteOrderAsync(int id)
        {
            string sql = "DELETE FROM Orders WHERE Id = @Id";
            await _dbConnection.ExecuteAsync(sql, new { Id = id });
        }
    }
        }




using OrderBookingConsoleApp.Models;
using OrderBookingConsoleApp.Services;
using System;
using System.Threading.Tasks;

namespace OrderBookingConsoleApp
{
    class Program
    {
        static async Task Main(string[] args)
        {
            OrderService orderService = new OrderService();

            Console.WriteLine("Order Booking Console Application");

            while (true)
            {
                Console.WriteLine("\nMenu:");
                Console.WriteLine("1. Create New Order");
                Console.WriteLine("2. View All Orders");
                Console.WriteLine("3. Get Order by ID");
                Console.WriteLine("4. Update Order Status");
                Console.WriteLine("5. Delete Order");
                Console.WriteLine("6. Exit");
                Console.Write("Select an option: ");
                
                var choice = Console.ReadLine();

                switch (choice)
                {
                    case "1":
                        await CreateNewOrder(orderService);
                        break;
                    case "2":
                        await DisplayAllOrders(orderService);
                        break;
                    case "3":
                        await GetOrderById(orderService);
                        break;
                    case "4":
                        await UpdateOrderStatus(orderService);
                        break;
                    case "5":
                        await DeleteOrder(orderService);
                        break;
                    case "6":
                        return;
                }
            }
        }

        private static async Task CreateNewOrder(OrderService service)
        {
            var order = new Order
            {
                Symbol = "AAPL",
                Quantity = 100,
                BookingTime = DateTime.Now,
                ExecutionTime = DateTime.Now.AddMinutes(30),
                FillPrice = 145.5,
                BidPrice = 145.0,
                Status = "Pending"
            };

            int orderId = await service.CreateOrderAsync(order);
            Console.WriteLine($"New Order Created with ID: {orderId}");
        }

        private static async Task DisplayAllOrders(OrderService service)
        {
            var orders = await service.GetAllOrdersAsync();
            foreach (var order in orders)
            {
                Console.WriteLine($"{order.Id} - {order.Symbol}, {order.Quantity} @ {order.FillPrice} [{order.Status}]");
            }
        }

        private static async Task GetOrderById(OrderService service)
        {
            Console.Write("Enter Order ID: ");
            int id = int.Parse(Console.ReadLine());

            var order = await service.GetOrderByIdAsync(id);
            if (order != null)
            {
                Console.WriteLine($"{order.Id} - {order.Symbol}, {order.Quantity} @ {order.FillPrice} [{order.Status}]");
            }
            else
            {
                Console.WriteLine("Order not found.");
            }
        }

        private static async Task UpdateOrderStatus(OrderService service)
        {
            Console.Write("Enter Order ID: ");
            int id = int.Parse(Console.ReadLine());

            Console.Write("Enter new Status: ");
            string status = Console.ReadLine();

            await service.UpdateOrderStatusAsync(id, status);
            Console.WriteLine("Order status updated.");
        }

        private static async Task DeleteOrder(OrderService service)
        {
            Console.Write("Enter Order ID: ");
            int id = int.Parse(Console.ReadLine());

            await service.DeleteOrderAsync(id);
            Console.WriteLine("Order deleted.");
        }
    }
        }



CREATE TABLE Orders (
    Id SERIAL PRIMARY KEY,
    Symbol VARCHAR(50),
    Quantity INT,
    BookingTime TIMESTAMP,
    ExecutionTime TIMESTAMP,
    FillPrice FLOAT,
    BidPrice FLOAT,
    Status VARCHAR(20)
);




