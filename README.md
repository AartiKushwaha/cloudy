import pytest
from unittest import mock
from fastapi import Request
from resultsretriever.v1.routers.cache import expire
from resultsretriever.clients.cache_to_client import cache_to_client
from resultsretriever.utils.response import DataResponse
from resultsretriever.utils.exceptions import ServiceException, ErrorCode


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "cache_name, mock_return_value, expected_status, expected_response",
    [
        # Case 1: Valid cache name, keys exist
        ("valid_cache", True, 200, {"status": "SUCCESS", "data": "Cache successfully expired."}),
        
        # Case 2: Valid cache name, no keys exist
        ("valid_cache_empty", False, 200, {"status": "SUCCESS", "data": "No action needed, cache was already empty."}),
        
        # Case 3: Invalid cache name
        ("non_existing_cache", None, 404, {
            "code": ErrorCode.CACHE_NOT_FOUND,
            "message": "Cache not found",
            "detail": "cache_name=non_existing_cache",
            "http_code": 404
        }),
        
        # Case 4: No cache name provided (Expire all caches)
        (None, True, 200, {"status": "SUCCESS", "data": "Cleared all caches."}),
    ]
)
@mock.patch("resultsretriever.clients.cache_to_client", return_value=mock.AsyncMock())
async def test_expire_cache(
    mock_cache_to_client,
    cache_name: str,
    mock_return_value: bool,
    expected_status: int,
    expected_response: dict
):
    cache_client_mock = mock.AsyncMock()
    mock_cache_to_client.return_value = cache_client_mock

    # Mocking method responses
    if cache_name == "non_existing_cache":
        cache_client_mock.map_cache_key_existence = mock.AsyncMock(return_value={})
    elif cache_name:
        cache_client_mock.map_cache_key_existence = mock.AsyncMock(return_value={cache_name: mock_return_value})
    else:
        cache_client_mock.map_cache_key_existence = mock.AsyncMock(return_value={})

    cache_client_mock.expire_specific_key = mock.AsyncMock(return_value=mock_return_value)
    cache_client_mock.expire_all = mock.AsyncMock()

    # Creating a fake request
    request = Request(scope={"type": "http"})

    try:
        result: DataResponse = await expire(name=cache_name, request=request)
        assert result.model_dump() == expected_response, f"Expected {expected_response}, got {result.model_dump()}"

        if cache_name == "non_existing_cache":
            cache_client_mock.expire_specific_key.assert_not_called()
            cache_client_mock.expire_all.assert_not_called()
        elif cache_name is None:
            cache_client_mock.expire_all.assert_called_once()
        else:
            if mock_return_value:
                cache_client_mock.expire_specific_key.assert_called_once()
            else:
                cache_client_mock.expire_specific_key.assert_not_called()

    except ServiceException as e:
        assert e.code == expected_response["code"]
