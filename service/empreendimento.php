<?php 

//errors
ini_set('display_errors', true);
error_reporting(E_ALL); 


/**
 * @api
 *
 * Essa é um script simples de php (bem simples) para receber um parâmetro GET chamado 'ids', 
 * criar um array à partir do seu valor, buscar os dados de um json fictício, filtra-los pelos ids que vieram como parâmetro
 * e retornar um novo objeto json com esses itens filtrados. 
 */


$ids = $_GET['ids'] ? $_GET['ids'] : null; 

if (!$ids)
	throw new Exception("Parâmetro 'ids' não tem valor", 1);

//cria um array de ids
$ids = explode(',', $ids); 

//filtra os ids apenas pegando os nuemros (para evitar dados incorretos)
$filtered_arr = array_filter($ids, function($item){
	return is_numeric($item); 
}); 

//pega os dados reais da api de imóveis
$empreendimentos = file_get_contents(dirname(__FILE__) . '/../data/empreendimentos.json'); 

//converto para array
$empreendimentos = json_decode($empreendimentos); 

//filtro os empreendimentos pegando apenas os que tem na lista de ids passada por GET
$filtered_empreendimentos = array_filter($empreendimentos->items, 
	function($item) use ($filtered_arr){
		return in_array($item->ID, $filtered_arr);  
	}); 

$result = json_encode($filtered_empreendimentos); 

echo $result; 





