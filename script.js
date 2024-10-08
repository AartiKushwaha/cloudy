using Newtonsoft.Json;
using OrderBookingConsoleApp.Models;
using System;
using System.Collections.Generic;
using System.Net;
using System.Text;

namespace OrderBookingConsoleApp
{
    class Program
    {
        private static Dictionary<int, Order> orderBook = new Dictionary<int, Order>();
        private static int orderIdCounter = 1;
        private static string userTopic = "miclarke"; // Simulating a user-based topic name

        static void Main(string[] args)
        {
            Console.WriteLine("Order Booking Service is starting...");

            using (HttpListener listener = new HttpListener())
            {
                listener.Prefixes.Add("http://localhost:5000/orders/");
                listener.Start();
                Console.WriteLine("Listening for requests at http://localhost:5000/orders/...");

                while (true)
                {
                    // Wait for an incoming request
                    HttpListenerContext context = listener.GetContext();
                    HttpListenerRequest request = context.Request;
                    HttpListenerResponse response = context.Response;

                    string responseString = HandleRequest(request);
                    byte[] buffer = Encoding.UTF8.GetBytes(responseString);

                    // Send the response back to the client
                    response.ContentLength64 = buffer.Length;
                    response.OutputStream.Write(buffer, 0, buffer.Length);
                    response.OutputStream.Close();
                }
            }
        }

        private static string HandleRequest(HttpListenerRequest request)
        {
            // Route the requests based on HTTP Method and URL
            if (request.HttpMethod == "POST" && request.Url.AbsolutePath == "/orders/order")
            {
                return CreateOrder(request);
            }
            else if (request.HttpMethod == "GET" && request.Url.AbsolutePath == "/orders/all")
            {
                return GetAllOrders();
            }
            else if (request.HttpMethod == "GET" && request.Url.AbsolutePath == "/orders/whoami")
            {
                return GetWhoAmI();
            }
            else if (request.HttpMethod == "POST" && request.Url.AbsolutePath.StartsWith("/orders/update"))
            {
                return UpdateOrderStatus(request);
            }

            return "Invalid request.";
        }

        private static string CreateOrder(HttpListenerRequest request)
        {
            string requestBody;
            using (var reader = new System.IO.StreamReader(request.InputStream, request.ContentEncoding))
            {
                requestBody = reader.ReadToEnd();
            }

            try
            {
                // Parse the incoming purchase data
                Purchase purchase = JsonConvert.DeserializeObject<Purchase>(requestBody);
                if (purchase == null || string.IsNullOrWhiteSpace(purchase.Symbol) || purchase.Quantity <= 0 || purchase.Price <= 0)
                    return "Invalid purchase data.";

                // Create a new order
                Order newOrder = new Order
                {
                    Id = orderIdCounter++,
                    Symbol = purchase.Symbol,
                    Quantity = purchase.Quantity,
                    BookingTime = DateTime.UtcNow,
                    BidPrice = purchase.Price,
                    Status = "Booked"
                };

                // Add to in-memory order book
                orderBook[newOrder.Id] = newOrder;

                return JsonConvert.SerializeObject(newOrder);
            }
            catch
            {
                return "Error processing order creation.";
            }
        }

        private static string GetAllOrders()
        {
            return JsonConvert.SerializeObject(orderBook.Values);
        }

        private static string GetWhoAmI()
        {
            return $"{{ \"TopicName\": \"{userTopic}\" }}";
        }

        private static string UpdateOrderStatus(HttpListenerRequest request)
        {
            string requestBody;
            using (var reader = new System.IO.StreamReader(request.InputStream, request.ContentEncoding))
            {
                requestBody = reader.ReadToEnd();
            }

            try
            {
                // Extract order ID from the URL
                string[] segments = request.Url.AbsolutePath.Split('/');
                if (segments.Length < 4 || !int.TryParse(segments[3], out int orderId))
                    return "Invalid order ID.";

                // Update the order status
                if (orderBook.ContainsKey(orderId))
                {
                    orderBook[orderId].Status = requestBody.Trim('"'); // Status is passed as raw string
                    orderBook[orderId].ExecutionTime = DateTime.UtcNow;
                    return JsonConvert.SerializeObject(orderBook[orderId]);
                }

                return $"Order ID {orderId} not found.";
            }
            catch
            {
                return "Error processing order update.";
            }
        }
    }
        }
